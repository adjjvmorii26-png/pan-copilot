/**
 * Energy Flow Scheduler (Trophic Energy) — pure module
 * Rank tasks by cognitive bandwidth fit, not only clock time.
 *
 * @typedef {'apex'|'mid'|'base'|'dormant'} Layer
 * @typedef {{ id?: string, title: string, focusCost?: number, deadlinePressure?: number, preferredLayer?: Layer }} Task
 * @typedef {{ bandwidth?: number, mood?: string, deltaHoursQuiet?: number }} EnergyState
 */

const LAYER_BAND = {
  apex: [0.7, 1.0],
  mid: [0.4, 0.75],
  base: [0.15, 0.45],
  dormant: [0, 0.2],
};

const MOOD_BAND = {
  strong: 0.85,
  resonant: 0.9,
  synapse: 0.55,
  oracle: 0.5,
  thin: 0.25,
  quiescent: 0.15,
  dormant: 0.1,
  shadow: 0.35,
};

/** @param {EnergyState} state */
export function estimateBandwidth(state = {}) {
  if (typeof state.bandwidth === 'number') {
    return clamp(state.bandwidth);
  }
  const mood = (state.mood || '').toLowerCase();
  let b = MOOD_BAND[mood];
  if (b == null) b = 0.5;
  // Long quiet can mean recovery OR coiled focus — slight lift after rest
  const quiet = state.deltaHoursQuiet || 0;
  if (quiet >= 8 && quiet <= 24) b = Math.min(1, b + 0.1);
  if (quiet > 48) b = Math.max(0.1, b - 0.05); // drift / fog
  return clamp(b);
}

/** @param {number} bandwidth @returns {Layer} */
export function layerForBandwidth(bandwidth) {
  const b = clamp(bandwidth);
  if (b >= 0.7) return 'apex';
  if (b >= 0.4) return 'mid';
  if (b >= 0.15) return 'base';
  return 'dormant';
}

/**
 * Score how well a task fits current energy.
 * Higher is better.
 * @param {Task} task
 * @param {number} bandwidth
 */
export function fitScore(task, bandwidth) {
  const cost = clamp(task.focusCost != null ? task.focusCost : 0.5);
  const pressure = clamp(task.deadlinePressure != null ? task.deadlinePressure : 0.3);
  const preferred = task.preferredLayer;
  const currentLayer = layerForBandwidth(bandwidth);

  // Prefer tasks whose cost is at or below available bandwidth
  let energyFit = 1 - Math.max(0, cost - bandwidth);

  // Layer alignment bonus
  if (preferred && preferred === currentLayer) energyFit += 0.15;
  if (preferred && LAYER_BAND[preferred]) {
    const [lo, hi] = LAYER_BAND[preferred];
    if (bandwidth >= lo && bandwidth <= hi) energyFit += 0.1;
  }

  // Pressure matters more when energy can meet cost
  const urgency = pressure * (cost <= bandwidth + 0.1 ? 1.2 : 0.5);

  return clamp(energyFit * 0.7 + urgency * 0.3);
}

/**
 * @param {Task[]} tasks
 * @param {EnergyState} state
 */
export function scheduleNext(tasks, state = {}) {
  const bandwidth = estimateBandwidth(state);
  const layer = layerForBandwidth(bandwidth);

  if (!tasks || tasks.length === 0 || layer === 'dormant') {
    return {
      next: {
        title: 'Recovery / no new load',
        layer: 'dormant',
        why: 'Bandwidth in dormant range — protect recovery',
      },
      deferred: (tasks || []).map((t) => t.title),
      bandwidth,
      layer,
    };
  }

  const ranked = tasks
    .map((t) => ({ task: t, score: fitScore(t, bandwidth) }))
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  const deferred = ranked.slice(1).map((r) => r.task.title);

  return {
    next: {
      id: best.task.id,
      title: best.task.title,
      layer,
      score: Number(best.score.toFixed(3)),
      why: whyLine(best.task, bandwidth, layer),
    },
    deferred,
    bandwidth: Number(bandwidth.toFixed(3)),
    layer,
  };
}

function whyLine(task, bandwidth, layer) {
  const cost = task.focusCost != null ? task.focusCost : 0.5;
  if (cost <= bandwidth) {
    return `Fits ${layer} band (cost ${cost} ≤ bandwidth ${bandwidth.toFixed(2)})`;
  }
  return `Best available under pressure; cost ${cost} exceeds band ${bandwidth.toFixed(2)} — watch friction`;
}

function clamp(n) {
  const x = Number(n);
  if (Number.isNaN(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

// Node / quick self-check
if (typeof process !== 'undefined' && process.argv && process.argv[1] && process.argv[1].includes('scheduler')) {
  const demo = scheduleNext(
    [
      { title: 'Ship triad HUD polish', focusCost: 0.8, deadlinePressure: 0.4, preferredLayer: 'apex' },
      { title: 'Linear triage', focusCost: 0.4, deadlinePressure: 0.6, preferredLayer: 'mid' },
      { title: 'Forge play seals', focusCost: 0.2, deadlinePressure: 0.1, preferredLayer: 'base' },
    ],
    { mood: 'strong' }
  );
  console.log(JSON.stringify(demo, null, 2));
}
