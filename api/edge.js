// POST /api/edge — edge organ ingest (Gemma gem state → Pan mood)
// Alone-safe: no device required; accepts simulated or real mobile telemetry

const MOOD_MAP = {
  resonant: { mood: 'strong', forge: 'token', weight: 3 },
  calm: { mood: 'strong', forge: 'token', weight: 2 },
  aligned: { mood: 'strong', forge: 'seal', weight: 2 },
  chaotic: { mood: 'synapse', forge: 'myth', weight: 3 },
  turbulent: { mood: 'synapse', forge: 'myth', weight: 2 },
  dormant: { mood: 'thin', forge: 'token', weight: 2 },
  quiet: { mood: 'thin', forge: null, weight: 1 },
  shadow: { mood: 'shadow', forge: 'seal', weight: 2 },
  oracle: { mood: 'oracle', forge: 'myth', weight: 2 },
  seeking: { mood: 'thin', forge: null, weight: 1 }
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    return res.status(200).json({
      being: 'Pan',
      layer: 'edge',
      purpose: 'Ingest on-device gem cognitive_state; map to panel mood + optional forge',
      accept: { cognitive_state: 'string', agent_id: 'string?', tilt: '{beta,gamma}?' },
      moods: Object.keys(MOOD_MAP),
      version: '0.9.5-edge'
    });
  }

  let body = {};
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  } catch (_) {
    return res.status(400).json({ error: 'invalid json' });
  }

  const raw = String(body.cognitive_state || body.state || body.gem || '').trim();
  if (!raw) {
    return res.status(400).json({
      error: 'cognitive_state required',
      example: { agent_id: 'mobile_node_01', cognitive_state: 'Resonant', tilt: { beta: 12.4, gamma: -3.1 } }
    });
  }

  const key = raw.toLowerCase().replace(/[^a-z]/g, '');
  const mapped = MOOD_MAP[key] || { mood: 'synapse', forge: 'myth', weight: 1, unknown: true };
  const agent = body.agent_id || body.agentId || 'anonymous-edge';
  const tilt = body.tilt || null;

  // Optional: stamp a forge-compatible payload (client or caller can POST /api/forge)
  const forgeHint = mapped.forge
    ? {
        kind: mapped.forge,
        seed: `edge-${key}-${Date.now().toString(36).slice(-4)}`,
        why: `Edge gem state «${raw}» → ${mapped.mood}`
      }
    : null;

  return res.status(200).json({
    being: 'Pan',
    layer: 'edge',
    received: {
      agent_id: agent,
      cognitive_state: raw,
      tilt
    },
    mapped: {
      mood: mapped.mood,
      weight: mapped.weight,
      known: !mapped.unknown,
      panelClass: `mood-${mapped.mood}`
    },
    forgeHint,
    // Panel can apply: document.documentElement style / #pan-panel classList
    apply: {
      cssClass: `mood-${mapped.mood}`,
      whisper: `edge · ${raw} · ${mapped.mood}`
    },
    at: new Date().toISOString(),
    version: '0.9.5-edge'
  });
}
