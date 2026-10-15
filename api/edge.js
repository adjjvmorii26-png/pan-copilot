// POST /api/edge — edge organ ingest
// Gemma gem state → mood · optional organ_metrics → activity triad

const BASE_THRESHOLD = 0.20;
const LAMBDA_DECAY = 0.05;

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

function getDynamicThreshold(deltaHours) {
  const h = Math.max(0, Number(deltaHours) || 0);
  return BASE_THRESHOLD * Math.exp(-LAMBDA_DECAY * h);
}

function evaluateTriad(gossip, forge, time, deltaHours) {
  const dynamicThreshold = getDynamicThreshold(deltaHours);
  const scores = {
    Gossip: Math.max(0, Math.min(1, Number(gossip) || 0)),
    Forge: Math.max(0, Math.min(1, Number(forge) || 0)),
    Time: Math.max(0, Math.min(1, Number(time) || 0))
  };
  const activeOrgans = Object.keys(scores).filter((o) => scores[o] >= dynamicThreshold);
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
  const bottleneckOrgan = Object.keys(scores).reduce((a, b) =>
    scores[a] < scores[b] ? a : b
  );
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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    return res.status(200).json({
      being: 'Pan',
      layer: 'edge',
      purpose: 'Gem cognitive_state → mood; optional organ_metrics → activity triad',
      accept: {
        cognitive_state: 'string',
        agent_id: 'string?',
        tilt: '{beta,gamma}?',
        delta_hours: 'number? (hours since last active chord)',
        organ_metrics: '{ gossip, forge, time }? scores 0..1'
      },
      moods: Object.keys(MOOD_MAP),
      triad: { BASE_THRESHOLD, LAMBDA_DECAY },
      version: '0.9.6-edge'
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

  // Allow metrics-only posts (no cognitive_state)
  if (!raw && !metrics) {
    return res.status(400).json({
      error: 'cognitive_state or organ_metrics required',
      example: {
        agent_id: 'mobile_node_01',
        cognitive_state: 'Quiescent',
        delta_hours: 12,
        organ_metrics: { gossip: 0.12, forge: 0.11, time: 0.14 }
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
  if (metrics && typeof metrics === 'object') {
    triad = evaluateTriad(
      metrics.gossip ?? metrics.Gossip,
      metrics.forge ?? metrics.Forge,
      metrics.time ?? metrics.Time,
      deltaHours != null ? deltaHours : 0
    );
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
    at: new Date().toISOString(),
    version: '0.9.6-edge'
  });
}
