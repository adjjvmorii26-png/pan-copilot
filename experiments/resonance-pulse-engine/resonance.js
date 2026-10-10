/**
 * Resonance Pulse Engine — multi-vector friction → one resolution pulse
 * Complements Triad Engine: triad says WHAT is on; resonance says WHERE to push.
 *
 * @typedef {{ Gossip?: number, Forge?: number, Time?: number, [k: string]: number|undefined }} Scores
 * @typedef {{ chord?: string, scores: Scores, friction?: number, bottleneck?: { organ: string, score: number }, dynamicThreshold?: number }} TriadLike
 */

const ORGANS = ['Gossip', 'Forge', 'Time'];

/** Pairwise absolute gaps */
export function frictionMatrix(scores) {
  const s = normalizeScores(scores);
  const pairs = [];
  for (let i = 0; i < ORGANS.length; i++) {
    for (let j = i + 1; j < ORGANS.length; j++) {
      const a = ORGANS[i];
      const b = ORGANS[j];
      pairs.push({
        pair: [a, b],
        gap: Math.abs(s[a] - s[b]),
        low: s[a] <= s[b] ? a : b,
        high: s[a] > s[b] ? a : b,
      });
    }
  }
  pairs.sort((x, y) => y.gap - x.gap);
  return pairs;
}

/** Max pairwise gap (matches triad friction) */
export function maxFriction(scores) {
  const m = frictionMatrix(scores);
  return m.length ? m[0].gap : 0;
}

/**
 * Temporal synthesis: decay threshold awareness + lag pressure.
 * @param {number} deltaHours hours since last active chord
 * @param {number} dynamicThreshold
 */
export function temporalPressure(deltaHours = 0, dynamicThreshold = 0.2) {
  const h = Math.max(0, Number(deltaHours) || 0);
  // Long silence → pressure to re-light any organ
  const silence = Math.min(1, h / 48);
  // Very low threshold means system is "hungry" for signal
  const hunger = Math.max(0, (0.2 - dynamicThreshold) / 0.2);
  return clamp(silence * 0.6 + hunger * 0.4);
}

/**
 * Core: emit one resolution pulse from triad-like state.
 * @param {TriadLike} triad
 * @param {{ deltaHours?: number, cognitiveState?: string }} ctx
 */
export function resolvePulse(triad, ctx = {}) {
  const scores = normalizeScores(triad.scores || {});
  const matrix = frictionMatrix(scores);
  const friction = triad.friction != null ? Number(triad.friction) : maxFriction(scores);
  const imbalance = friction > 0.5;
  const bottleneck =
    triad.bottleneck?.organ ||
    ORGANS.reduce((a, b) => (scores[a] < scores[b] ? a : b));

  const deltaHours = ctx.deltaHours != null ? ctx.deltaHours : 0;
  const theta = triad.dynamicThreshold != null ? triad.dynamicThreshold : 0.2;
  const temporal = temporalPressure(deltaHours, theta);

  // Resonance = inverse of friction, lifted by temporal need to act
  const resonance = clamp(1 - friction + temporal * 0.15);

  const topGap = matrix[0] || { pair: ['Gossip', 'Forge'], gap: 0, low: bottleneck, high: 'Gossip' };

  const move = pickMove({
    bottleneck,
    scores,
    friction,
    imbalance,
    topGap,
    temporal,
    cognitiveState: ctx.cognitiveState,
  });

  return {
    layer: 'resonance-pulse',
    resonance: Number(resonance.toFixed(3)),
    friction: Number(friction.toFixed(4)),
    imbalance,
    temporal: Number(temporal.toFixed(3)),
    vectors: matrix.map((p) => ({
      pair: p.pair.join('⟷'),
      gap: Number(p.gap.toFixed(4)),
      feed: p.low,
    })),
    pulse: move,
    at: new Date().toISOString(),
  };
}

function pickMove({ bottleneck, scores, friction, imbalance, topGap, temporal, cognitiveState }) {
  const state = (cognitiveState || '').toLowerCase();

  if (state === 'quiescent' || state === 'dormant') {
    return {
      organ: 'Time',
      action: 'hold',
      intensity: 'soft',
      oneMove: 'Protect recovery — no new Forge load; optional light Gossip scan only',
    };
  }

  if (imbalance && topGap.gap > 0.5) {
    return {
      organ: topGap.low,
      action: 'feed',
      intensity: 'hard',
      oneMove: `Feed ${topGap.low} (gap ${topGap.gap.toFixed(2)} vs ${topGap.high}) — restore chord balance`,
    };
  }

  if (scores[bottleneck] < 0.35) {
    return {
      organ: bottleneck,
      action: 'feed',
      intensity: temporal > 0.5 ? 'hard' : 'medium',
      oneMove: `Raise ${bottleneck} above thin band (now ${scores[bottleneck].toFixed(2)})`,
    };
  }

  if (friction < 0.2 && temporal < 0.3) {
    return {
      organ: 'Forge',
      action: 'mint',
      intensity: 'soft',
      oneMove: 'Chord balanced — mint a small asset (seal/token) to leave a trace',
    };
  }

  return {
    organ: bottleneck,
    action: 'nudge',
    intensity: 'soft',
    oneMove: `Light nudge on ${bottleneck}; keep ${ORGANS.filter((o) => o !== bottleneck).join(' + ')} steady`,
  };
}

function normalizeScores(scores) {
  const out = {};
  for (const o of ORGANS) {
    const v = scores[o] ?? scores[o.toLowerCase()] ?? 0;
    out[o] = clamp(v);
  }
  return out;
}

function clamp(n) {
  const x = Number(n);
  if (Number.isNaN(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

// Demo when run directly
if (typeof process !== 'undefined' && process.argv?.[1]?.includes('resonance')) {
  const sample = resolvePulse(
    {
      scores: { Gossip: 0.9, Forge: 0.4, Time: 0.85 },
      friction: 0.5,
      bottleneck: { organ: 'Forge', score: 0.4 },
      dynamicThreshold: 0.18,
    },
    { deltaHours: 2, cognitiveState: 'Resonant' }
  );
  console.log(JSON.stringify(sample, null, 2));
}
