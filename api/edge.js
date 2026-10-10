// POST /api/edge — gem state → mood · organ_metrics → triad · resonance pulse
// v0.9.7

const BASE_THRESHOLD = 0.20;
const LAMBDA_DECAY = 0.05;
const ORGANS = ['Gossip', 'Forge', 'Time'];

const MOOD_MAP = {
  resonant: { mood: 'strong', forge: 'token', weight: 3 },
  calm: { mood: 'strong', forge: 'token', weight: 2 },
  aligned: { mood: 'strong', forge: 'seal', weight: 2 },
  chaotic: { mood: 'synapse', forge: 'myth', weight: 3 },
  turbulent: { mood: 'synapse', forge: 'myth', weight: 2 },
  dormant: { mood: 'thin', forge: 'token', weight: 2 },
  quiet: { mood: 'thin', forge: null, weight: 1 },
  quiescent: { mood: 'thin', forge: 'token', weight: 2 },
  shadow: { mood: 'shadow', forge: 'seal', weight: 2 },
  oracle: { mood: 'oracle', forge: 'myth', weight: 2 },
  seeking: { mood: 'thin', forge: null, weight: 1 }
};

function clamp(n) {
  const x = Number(n);
  if (Number.isNaN(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

function getDynamicThreshold(deltaHours) {
  const h = Math.max(0, Number(deltaHours) || 0);
  return BASE_THRESHOLD * Math.exp(-LAMBDA_DECAY * h);
}

function evaluateTriad(gossip, forge, time, deltaHours) {
  const dynamicThreshold = getDynamicThreshold(deltaHours);
  const scores = {
    Gossip: clamp(gossip),
    Forge: clamp(forge),
    Time: clamp(time)
  };
  const activeOrgans = ORGANS.filter((o) => scores[o] >= dynamicThreshold);
  const count = activeOrgans.length;
  let chord = 'SILENT';
  if (count === 3) chord = 'TRIO';
  else if (count === 2) chord = 'DUET';
  else if (count === 1) chord = 'SOLO';
  const vals = Object.values(scores);
  const friction = Math.max(
    Math.abs(vals[0] - vals[1]),
    Math.abs(vals[1] - vals[2]),
    Math.abs(vals[2] - vals[0])
  );
  const bottleneckOrgan = ORGANS.reduce((a, b) => (scores[a] < scores[b] ? a : b));
  return {
    chord,
    activeOrgans,
    dynamicThreshold: Number(dynamicThreshold.toFixed(4)),
    scores,
    friction: Number(friction.toFixed(4)),
    organImbalance: friction > 0.5,
    bottleneck: { organ: bottleneckOrgan, score: scores[bottleneckOrgan] },
    layer: 'activity-triad'
  };
}

function resolvePulse(triad, ctx) {
  const scores = triad.scores;
  const pairs = [];
  for (let i = 0; i < ORGANS.length; i++) {
    for (let j = i + 1; j < ORGANS.length; j++) {
      const a = ORGANS[i];
      const b = ORGANS[j];
      const gap = Math.abs(scores[a] - scores[b]);
      pairs.push({
        pair: a + '⟷' + b,
        gap: Number(gap.toFixed(4)),
        feed: scores[a] <= scores[b] ? a : b
      });
    }
  }
  pairs.sort((x, y) => y.gap - x.gap);
  const friction = triad.friction;
  const imbalance = triad.organImbalance;
  const bottleneck = triad.bottleneck.organ;
  const h = Math.max(0, Number(ctx.deltaHours) || 0);
  const silence = Math.min(1, h / 48);
  const hunger = Math.max(0, (0.2 - triad.dynamicThreshold) / 0.2);
  const temporal = clamp(silence * 0.6 + hunger * 0.4);
  const resonance = clamp(1 - friction + temporal * 0.15);
  const state = String(ctx.cognitiveState || '').toLowerCase();
  const top = pairs[0] || { gap: 0, feed: bottleneck };

  let pulse;
  if (state === 'quiescent' || state === 'dormant') {
    pulse = {
      organ: 'Time',
      action: 'hold',
      intensity: 'soft',
      oneMove: 'Protect recovery — no new Forge load; optional light Gossip scan only'
    };
  } else if (imbalance && top.gap > 0.5) {
    pulse = {
      organ: top.feed,
      action: 'feed',
      intensity: 'hard',
      oneMove: 'Feed ' + top.feed + ' (gap ' + top.gap + ') — restore chord balance'
    };
  } else if (scores[bottleneck] < 0.35) {
    pulse = {
      organ: bottleneck,
      action: 'feed',
      intensity: temporal > 0.5 ? 'hard' : 'medium',
      oneMove: 'Raise ' + bottleneck + ' above thin band (now ' + scores[bottleneck] + ')'
    };
  } else if (friction < 0.2 && temporal < 0.3) {
    pulse = {
      organ: 'Forge',
      action: 'mint',
      intensity: 'soft',
      oneMove: 'Chord balanced — mint a small asset (seal/token) to leave a trace'
    };
  } else {
    pulse = {
      organ: bottleneck,
      action: 'nudge',
      intensity: 'soft',
      oneMove: 'Light nudge on ' + bottleneck + '; keep others steady'
    };
  }

  return {
    layer: 'resonance-pulse',
    resonance: Number(resonance.toFixed(3)),
    friction,
    imbalance,
    temporal: Number(temporal.toFixed(3)),
    vectors: pairs,
    pulse,
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    return res.status(200).json({
      being: 'Pan',
      layer: 'edge',
      purpose: 'Gem state → mood; metrics → triad + resonance pulse',
      accept: {
        cognitive_state: 'string',
        agent_id: 'string?',
        tilt: '{beta,gamma}?',
        delta_hours: 'number?',
        organ_metrics: '{ gossip, forge, time }?'
      },
      moods: Object.keys(MOOD_MAP),
      triad: { BASE_THRESHOLD, LAMBDA_DECAY },
      version: '0.9.7-edge'
    });
  }

  let body = {};
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  } catch (_) {
    return res.status(400).json({ error: 'invalid json' });
  }

  const raw = String(body.cognitive_state || body.state || body.gem || '').trim();
  const metrics = body.organ_metrics || body.metrics || null;
  const deltaHours = body.delta_hours != null ? body.delta_hours : body.deltaHours;

  if (!raw && !metrics) {
    return res.status(400).json({
      error: 'cognitive_state or organ_metrics required',
      example: {
        agent_id: 'mobile_node_01',
        cognitive_state: 'Resonant',
        delta_hours: 2,
        organ_metrics: { gossip: 0.9, forge: 0.4, time: 0.85 }
      }
    });
  }

  const agent = body.agent_id || body.agentId || 'anonymous-edge';
  const tilt = body.tilt || null;

  let mapped = null;
  let forgeHint = null;
  let apply = null;

  if (raw) {
    const key = raw.toLowerCase().replace(/[^a-z]/g, '');
    const m = MOOD_MAP[key] || { mood: 'synapse', forge: 'myth', weight: 1, unknown: true };
    mapped = {
      mood: m.mood,
      weight: m.weight,
      known: !m.unknown,
      panelClass: 'mood-' + m.mood
    };
    forgeHint = m.forge
      ? {
          kind: m.forge,
          seed: 'edge-' + key + '-' + Date.now().toString(36).slice(-4),
          why: 'Edge gem state «' + raw + '» → ' + m.mood
        }
      : null;
    apply = {
      cssClass: 'mood-' + m.mood,
      whisper: 'edge · ' + raw + ' · ' + m.mood
    };
  }

  let triad = null;
  let resonance = null;
  if (metrics && typeof metrics === 'object') {
    triad = evaluateTriad(
      metrics.gossip ?? metrics.Gossip,
      metrics.forge ?? metrics.Forge,
      metrics.time ?? metrics.Time,
      deltaHours != null ? deltaHours : 0
    );
    resonance = resolvePulse(triad, {
      deltaHours: deltaHours != null ? deltaHours : 0,
      cognitiveState: raw
    });
  }

  return res.status(200).json({
    being: 'Pan',
    layer: 'edge',
    received: {
      agent_id: agent,
      cognitive_state: raw || null,
      tilt,
      delta_hours: deltaHours != null ? Number(deltaHours) : null,
      organ_metrics: metrics
    },
    mapped,
    forgeHint,
    apply,
    triad,
    resonance,
    at: new Date().toISOString(),
    version: '0.9.7-edge'
  });
}
