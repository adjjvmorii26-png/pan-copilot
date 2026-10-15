// Optional LLM Bridge — OpenAI-compatible (Ollama / OmniRoute / etc.)
// POST /api/llm-bridge  { "messages": [...], "model"?: string }
// Requires LLM_BASE_URL. Safe no-op if missing.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const base = process.env.LLM_BASE_URL;
  if (!base) {
    return res.status(503).json({
      error: 'LLM_BASE_URL not set',
      hint: 'Set LLM_BASE_URL to Ollama (http://host:11434/v1) or OmniRoute gateway. Localhost only works if this function can reach it.'
    });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') body = JSON.parse(body || '{}');
    body = body || {};
    const model = body.model || process.env.LLM_MODEL || 'llama3.2';
    const messages = body.messages || [
      { role: 'system', content: 'You are Pan, a distributed panoptic co-pilot. Be brief. Prefer constraints over essays.' },
      { role: 'user', content: body.query || 'Status?' }
    ];

    const url = base.replace(/\/$/, '') + '/chat/completions';
    const headers = { 'Content-Type': 'application/json' };
    if (process.env.LLM_API_KEY) headers.Authorization = `Bearer ${process.env.LLM_API_KEY}`;

    const r = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ model, messages, temperature: 0.4 })
    });
    const data = await r.json();
    if (!r.ok) {
      return res.status(r.status).json({ error: 'upstream', detail: data });
    }
    const text = data.choices?.[0]?.message?.content || data.choices?.[0]?.text || '';
    return res.status(200).json({
      text,
      model: data.model || model,
      source: 'llm-bridge',
      base: base.replace(/\/v1\/?$/, '')
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || String(err) });
  }
}
