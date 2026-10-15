// POST/GET /api/forge — Pan creates unique assets from organ state
// Kinds: seal | chord | token | myth

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  let body = {};
  if (req.method === 'POST') {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  }
  const kind = (body.kind || req.query?.kind || 'seal').toLowerCase();
  const seed = body.seed || req.query?.seed || Date.now().toString(36);

  const state = await probeOrgans();
  const asset = forgeAsset(kind, state, seed);

  if (body.format === 'svg' || req.query?.format === 'svg') {
    res.setHeader('Content-Type', 'image/svg+xml');
    return res.status(200).send(asset.svg);
  }

  return res.status(200).json({
    being: 'Pan',
    layer: 'forge',
    kind: asset.kind,
    name: asset.name,
    whyPan: asset.whyPan,
    organs: state,
    svg: asset.svg,
    dataUrl: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(asset.svg),
    at: new Date().toISOString(),
    version: '0.9.4-forge'
  });
}

async function probeOrgans() {
  const notion = Boolean(process.env.NOTION_TOKEN && process.env.NOTION_DATABASE_ID);
  const linear = Boolean(process.env.LINEAR_API_KEY);
  const calendarEnv = Boolean(process.env.CALENDAR_ICS_URL);
  let notionOk = false, linearOk = false, calendarOk = false;
  try {
    if (notion) {
      const r = await fetch(`https://api.notion.com/v1/databases/${process.env.NOTION_DATABASE_ID}`, {
        headers: { Authorization: `Bearer ${process.env.NOTION_TOKEN}`, 'Notion-Version': '2022-06-28' }
      });
      notionOk = r.ok;
    }
  } catch (_) {}
  try {
    if (linear) {
      const r = await fetch('https://api.linear.app/graphql', {
        method: 'POST',
        headers: { Authorization: process.env.LINEAR_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: '{ viewer { id } }' })
      });
      linearOk = r.ok;
    }
  } catch (_) {}
  if (calendarEnv) {
    calendarOk = true;
    try {
      const r = await fetch(process.env.CALENDAR_ICS_URL);
      if (r.ok) {
        const text = await r.text();
        calendarOk = /BEGIN:VCALENDAR/i.test(text);
      } else calendarOk = false;
    } catch (_) {
      calendarOk = true;
    }
  }
  const beating = [notionOk, linearOk, calendarOk].filter(Boolean).length;
  let chord = 'silence';
  if (beating >= 3) chord = 'trio';
  else if (beating === 2) chord = 'duet';
  else if (beating === 1) chord = 'solo';
  const coherence = (notionOk ? 35 : 0) + (linearOk ? 35 : 0) + (calendarOk ? 30 : 0);
  return { notion: notionOk, linear: linearOk, calendar: calendarOk, chord, coherence };
}

function forgeAsset(kind, state, seed) {
  const hash = simpleHash(seed + kind + state.chord);
  const hue = 190 + (hash % 40);
  const names = {
    seal: ['Velvet Seal', 'Cord Lock', 'Palace Mark', 'Nerve Sigil', 'Trio Brand', 'Duet Brand'],
    chord: ['Chord Glyph', 'Organ Interval', 'Synapse Arc', 'Pulse Interval', 'Trio Arc'],
    token: ['Mood Token', 'Thin Coin', 'Strong Shard', 'Oracle Chip'],
    myth: ['Myth Fragment', 'Constellation Shard', 'Dream Chip']
  };
  const pool = names[kind] || names.seal;
  const name = pool[hash % pool.length] + ' · ' + seed.slice(-4);

  if (kind === 'chord') return { kind, name, whyPan: 'Drawn from live organ chord, not a static logo', svg: svgChord(state, hue, name) };
  if (kind === 'token') return { kind, name, whyPan: 'Mood token encodes pulse as geometry', svg: svgToken(state, hue, name) };
  if (kind === 'myth') return { kind, name, whyPan: 'Myth line crystallized as constellation ink', svg: svgMyth(state, hue, name) };
  return { kind: 'seal', name, whyPan: 'Coherence seal stamped from live organ chord', svg: svgSeal(state, hue, name) };
}

function simpleHash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function svgSeal(state, hue, name) {
  const c = state.coherence;
  const a1 = state.notion ? `hsl(${hue},80%,60%)` : '#334155';
  const a2 = state.linear ? `hsl(${hue + 20},75%,55%)` : '#334155';
  const a3 = state.calendar ? `hsl(${hue + 40},70%,55%)` : '#1e293b';
  const cordOn = state.chord === 'duet' || state.chord === 'trio';
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <radialGradient id="g" cx="50%" cy="45%" r="55%">
      <stop offset="0%" stop-color="#f0f9ff"/>
      <stop offset="50%" stop-color="hsl(${hue},70%,45%)"/>
      <stop offset="100%" stop-color="#030712"/>
    </radialGradient>
  </defs>
  <rect width="200" height="200" fill="#030712"/>
  <circle cx="100" cy="100" r="88" fill="none" stroke="${a1}" stroke-width="2" opacity="0.7"/>
  <circle cx="100" cy="100" r="72" fill="none" stroke="${a2}" stroke-width="1.2" opacity="0.5"/>
  <circle cx="100" cy="100" r="40" fill="url(#g)"/>
  <text x="100" y="96" text-anchor="middle" fill="#e0f2fe" font-family="Georgia,serif" font-size="14" letter-spacing="2">${escapeXml(state.chord.toUpperCase())}</text>
  <text x="100" y="114" text-anchor="middle" fill="#94a3b8" font-family="system-ui,sans-serif" font-size="10">coh ${c}</text>
  <text x="100" y="180" text-anchor="middle" fill="#64748b" font-family="system-ui,sans-serif" font-size="8">${escapeXml(name)}</text>
  <circle cx="40" cy="100" r="5" fill="${state.notion ? a1 : '#1e293b'}"/>
  <circle cx="160" cy="100" r="5" fill="${state.linear ? a2 : '#1e293b'}"/>
  <circle cx="100" cy="165" r="4" fill="${a3}"/>
  <line x1="45" y1="100" x2="155" y2="100" stroke="${cordOn ? a1 : '#1e293b'}" stroke-width="1.5" opacity="0.8"/>
</svg>`;
}

function svgChord(state, hue, name) {
  const nodes = [
    { x: 50, y: 120, on: state.notion, label: 'M' },
    { x: 100, y: 50, on: true, label: 'P' },
    { x: 150, y: 120, on: state.linear, label: 'L' },
    { x: 100, y: 160, on: state.calendar, label: 'C' }
  ];
  const lines = [];
  if (state.notion) lines.push(`<line x1="50" y1="120" x2="100" y2="50" stroke="hsl(${hue},70%,55%)" stroke-width="1.5"/>`);
  if (state.linear) lines.push(`<line x1="150" y1="120" x2="100" y2="50" stroke="hsl(${hue + 15},70%,55%)" stroke-width="1.5"/>`);
  if (state.calendar) lines.push(`<line x1="100" y1="160" x2="100" y2="50" stroke="hsl(${hue + 30},65%,55%)" stroke-width="1.5"/>`);
  const dots = nodes.map(n =>
    `<circle cx="${n.x}" cy="${n.y}" r="${n.on ? 8 : 5}" fill="${n.on ? `hsl(${hue},75%,55%)` : '#1e293b'}"/>` +
    `<text x="${n.x}" y="${n.y + 3}" text-anchor="middle" fill="#0f172a" font-size="8" font-family="system-ui">${n.label}</text>`
  ).join('');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <rect width="200" height="200" fill="#030712"/>
  ${lines.join('')}
  ${dots}
  <text x="100" y="190" text-anchor="middle" fill="#64748b" font-size="9" font-family="system-ui">${escapeXml(name)} · ${state.chord}</text>
</svg>`;
}

function svgToken(state, hue, name) {
  const pulse = state.coherence >= 90 ? 'TRIO' : state.coherence >= 70 ? 'STRONG' : state.coherence >= 35 ? 'ALIGN' : 'SEEK';
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs><radialGradient id="t" cx="50%" cy="40%" r="60%"><stop offset="0%" stop-color="hsl(${hue},80%,70%)"/><stop offset="100%" stop-color="#0c4a6e"/></radialGradient></defs>
  <circle cx="60" cy="60" r="54" fill="#030712" stroke="hsl(${hue},60%,40%)" stroke-width="2"/>
  <circle cx="60" cy="60" r="36" fill="url(#t)"/>
  <text x="60" y="58" text-anchor="middle" fill="#f8fafc" font-size="11" font-family="system-ui" font-weight="600">${pulse}</text>
  <text x="60" y="72" text-anchor="middle" fill="#e0f2fe" font-size="9" font-family="system-ui">${state.coherence}</text>
  <text x="60" y="108" text-anchor="middle" fill="#64748b" font-size="7">${escapeXml(name)}</text>
</svg>`;
}

function svgMyth(state, hue, name) {
  const myth = state.coherence >= 90 ? 'constellation locked' : state.coherence >= 70 ? 'stars aligning' : state.coherence >= 35 ? 'first light' : 'seeking signal';
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 100" width="320" height="100">
  <rect width="320" height="100" rx="12" fill="#030712" stroke="hsl(${hue},50%,30%)"/>
  <circle cx="36" cy="50" r="10" fill="hsl(${hue},75%,55%)"/>
  <text x="56" y="46" fill="#e0f2fe" font-family="Georgia,serif" font-size="14">${escapeXml(myth)}</text>
  <text x="56" y="66" fill="#64748b" font-family="system-ui" font-size="10">${escapeXml(name)} · ${state.chord}</text>
</svg>`;
}

function escapeXml(s) {
  return String(s).replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '"');
}
