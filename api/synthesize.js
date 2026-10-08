// Pan Context Synthesis – Vercel Serverless Function v0.9
// Organs: Notion + Linear + Calendar (ICS) + Page + Synapse cross-talk

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body || '{}'); } catch { body = {}; }
    }
    body = body || {};

    const query = body.query || '';
    const pageTitle = body.pageTitle || '';
    const pageUrl = body.pageUrl || '';
    const focus = body.focus || ['memory', 'tasks', 'calendar'];
    const clientEvents = Array.isArray(body.calendarEvents) ? body.calendarEvents : [];

    const signals = [];
    const tensions = [];
    let notionOk = false;
    let linearOk = false;
    let calendarOk = false;

    if (focus.includes('memory')) {
      const memory = await fetchMemoryPalace();
      signals.push(...memory.signals);
      if (memory.warning) tensions.push(memory.warning);
      notionOk = memory.ok;
    }

    if (focus.includes('tasks')) {
      const tasks = await fetchLinearIssues();
      signals.push(...tasks.signals);
      if (tasks.warning) tensions.push(tasks.warning);
      linearOk = tasks.ok;
    }

    if (focus.includes('calendar')) {
      const cal = await fetchCalendar(clientEvents);
      signals.push(...cal.signals);
      if (cal.warning) tensions.push(cal.warning);
      calendarOk = cal.ok;
    }

    signals.push({
      source: 'Page',
      text: pageTitle || pageUrl || 'unknown page',
      score: 2
    });

    const scored = signals
      .map((s) => ({ ...s, score: s.score ?? scoreSignal(s) }))
      .sort((a, b) => b.score - a.score);

    const bottleneck = findBottleneck(notionOk, linearOk, calendarOk, scored);
    const recommendations = buildRecs(notionOk, linearOk, calendarOk, bottleneck, scored);

    const liveCount = scored.filter(
      (s) => !String(s.text).startsWith('[stub]') && !String(s.text).startsWith('[error]')
    ).length;

    let status = query
      ? `Synthesis for "${query}". ${liveCount} live signal(s).`
      : `General status. ${liveCount} live signal(s).`;
    if (bottleneck) status += ` Bottleneck: ${bottleneck}`;

    const synapse = computeSynapse(notionOk, linearOk, calendarOk, scored, tensions);
    if (synapse.phrase) status += ` Synapse: ${synapse.phrase}`;

    return res.status(200).json({
      status,
      signals: scored.map(({ source, text }) => ({ source, text })),
      tensions,
      recommendations,
      synapse,
      meta: {
        generatedAt: new Date().toISOString(),
        version: '0.9.0-synapse',
        host: 'vercel',
        bottleneck: bottleneck || null,
        live: { notion: notionOk, linear: linearOk, calendar: calendarOk },
        coherence: synapse.coherence
      }
    });
  } catch (err) {
    console.error('[Pan]', err);
    return res.status(500).json({
      error: 'Synthesis failed',
      message: err?.message || String(err)
    });
  }
}

function computeSynapse(notionOk, linearOk, calendarOk, signals, tensions) {
  const sources = new Set(signals.map((s) => s.source).filter(Boolean));
  const organHits = ['Memory Palace', 'Linear', 'Calendar', 'Page'].filter((x) => sources.has(x)).length;
  let coherence = 0;
  if (notionOk) coherence += 34;
  if (linearOk) coherence += 34;
  if (calendarOk) coherence += 12;
  coherence += Math.min(20, organHits * 5);
  if (tensions && tensions.length) coherence = Math.max(0, coherence - tensions.length * 8);
  const themes = [];
  const blob = signals.map((s) => String(s.text).toLowerCase()).join(' ');
  if (/permission|share|token|gate|velvet/.test(blob)) themes.push('velvet-rope');
  if (/oracle|bottleneck|one move/.test(blob)) themes.push('oracle');
  if (/proof|pass|test|synapse/.test(blob)) themes.push('proof');
  if (/legend|asset|forge|alchemist/.test(blob)) themes.push('legend');
  if (/compost|sprawl/.test(blob)) themes.push('compost');
  let chord = 'silence';
  if (notionOk && linearOk && calendarOk) chord = 'trio';
  else if (notionOk && linearOk) chord = 'duet';
  else if (notionOk || linearOk) chord = 'solo';
  let phrase = '';
  if (chord === 'duet') phrase = 'Memory ⟷ Linear cord lit';
  else if (chord === 'trio') phrase = 'Full organ chord';
  else if (chord === 'solo') phrase = notionOk ? 'Memory singing alone' : 'Linear singing alone';
  else phrase = 'no organ chord';
  if (themes.length) phrase += ` · themes: ${themes.slice(0, 3).join(', ')}`;
  return {
    coherence,
    chord,
    themes,
    phrase,
    myth: coherence >= 70 ? 'constellation locked' : coherence >= 40 ? 'stars aligning' : 'seeking signal'
  };
}

function scoreSignal(s) {
  const t = String(s.text || '').toLowerCase();
  let score = 3;
  if (s.source === 'Linear') {
    if (t.includes('[in progress]')) score = 9;
    else if (t.includes('[backlog]')) score = 5;
    else score = 6;
  }
  if (s.source === 'Memory Palace') {
    if (t.startsWith('[error]')) score = 8;
    else if (t.startsWith('[stub]')) score = 2;
    else score = 7;
  }
  if (s.source === 'Calendar') {
    if (t.startsWith('[stub]')) score = 2;
    else if (t.includes('today') || t.includes('now') || /\d{1,2}:\d{2}/.test(t)) score = 8;
    else score = 6;
  }
  if (t.includes('blocked') || t.includes('404') || t.includes('share')) score += 2;
  return score;
}

function findBottleneck(notionOk, linearOk, calendarOk, signals) {
  if (process.env.NOTION_TOKEN && !notionOk) return 'Notion Memory Palace not readable';
  if (!linearOk && !process.env.LINEAR_API_KEY) return 'LINEAR_API_KEY missing';
  const inProg = signals.filter((s) => /\[in progress\]/i.test(s.text));
  if (inProg.length >= 2) return `Multiple In Progress issues (${inProg.length})`;
  return null;
}

function buildRecs(notionOk, linearOk, calendarOk, bottleneck, signals) {
  const recs = [];
  if (bottleneck && bottleneck.includes('Notion')) {
    recs.push('1. Check NOTION_TOKEN / database share for integration pan');
  }
  const cal = signals.filter((s) => s.source === 'Calendar' && !String(s.text).startsWith('[stub]'));
  if (cal.length) recs.push(`${recs.length + 1}. Time: ${cal[0].text}`);
  const top = signals.find((s) => s.source === 'Linear' && /in progress/i.test(s.text));
  if (top) recs.push(`${recs.length + 1}. Advance: ${top.text}`);
  else if (notionOk && linearOk) recs.push(`${recs.length + 1}. Organs healthy — advance highest-score signal`);
  recs.push(`${recs.length + 1}. Log decisions as Evolution in Memory Palace`);
  return recs.slice(0, 5);
}

async function fetchMemoryPalace() {
  const token = process.env.NOTION_TOKEN;
  const databaseId = process.env.NOTION_DATABASE_ID;
  if (!token || !databaseId) {
    return { ok: false, signals: [{ source: 'Memory Palace', text: '[stub] NOTION_TOKEN or DATABASE_ID missing.', score: 2 }] };
  }
  try {
    const res = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        page_size: 12,
        filter: {
          and: [
            { property: 'Status', select: { equals: 'Active' } }
          ]
        },
        sorts: [{ timestamp: 'last_edited_time', direction: 'descending' }]
      })
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Notion ${res.status}: ${t.slice(0, 160)}`);
    }
    const data = await res.json();
    const signals = (data.results || []).map((page) => {
      const prop = page.properties?.Name || page.properties?.title;
      const rich = prop?.title || prop?.rich_text || [];
      const title = rich.map((x) => x.plain_text).join('') || 'Untitled';
      const type = page.properties?.Type?.select?.name || 'Entry';
      const status = page.properties?.Status?.select?.name || '';
      return { source: 'Memory Palace', text: `${type}${status ? ` (${status})` : ''}: ${title}`, score: 7 };
    });
    if (!signals.length) signals.push({ source: 'Memory Palace', text: 'No Active entries.', score: 3 });
    return { ok: true, signals };
  } catch (err) {
    return { ok: false, signals: [{ source: 'Memory Palace', text: `[error] ${err.message}`, score: 8 }], warning: 'Notion query failed' };
  }
}

async function fetchLinearIssues() {
  const apiKey = process.env.LINEAR_API_KEY;
  if (!apiKey) {
    return { ok: false, signals: [{ source: 'Linear', text: '[stub] LINEAR_API_KEY not set yet.', score: 2 }] };
  }
  try {
    const res = await fetch('https://api.linear.app/graphql', {
      method: 'POST',
      headers: { Authorization: apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `query { issues(filter: { project: { name: { containsIgnoreCase: "Pan" } }, state: { type: { nin: ["completed", "canceled"] } } }, first: 8, orderBy: updatedAt) { nodes { identifier title state { name } priority } } }`
      })
    });
    if (!res.ok) throw new Error(`Linear ${res.status}`);
    const data = await res.json();
    if (data.errors) throw new Error(data.errors[0]?.message || 'Linear error');
    const nodes = data.data?.issues?.nodes || [];
    const signals = nodes.map((i) => {
      const state = i.state?.name || '?';
      let score = 5;
      if (/in progress/i.test(state)) score = 9;
      if (i.priority === 1) score += 2;
      if (i.priority === 2) score += 1;
      return { source: 'Linear', text: `${i.identifier} [${state}] ${i.title}`, score };
    });
    if (!signals.length) signals.push({ source: 'Linear', text: 'No open issues in Pan project.', score: 3 });
    return { ok: true, signals };
  } catch (err) {
    return { ok: false, signals: [{ source: 'Linear', text: `[error] ${err.message}`, score: 4 }], warning: 'Linear query failed' };
  }
}

async function fetchCalendar(clientEvents) {
  if (Array.isArray(clientEvents) && clientEvents.length) {
    return {
      ok: true,
      signals: clientEvents.slice(0, 5).map((e) => ({
        source: 'Calendar',
        text: typeof e === 'string' ? e : (e.title || e.summary || JSON.stringify(e)),
        score: 6
      }))
    };
  }
  const ics = process.env.CALENDAR_ICS_URL;
  if (!ics) {
    return { ok: false, signals: [{ source: 'Calendar', text: '[stub] No ICS URL — calendar optional.', score: 1 }] };
  }
  try {
    const r = await fetch(ics);
    if (!r.ok) throw new Error(`ICS ${r.status}`);
    const text = await r.text();
    const events = [];
    for (const block of text.split('BEGIN:VEVENT').slice(1)) {
      const sum = (block.match(/SUMMARY:([^\r\n]+)/) || [])[1];
      if (sum) events.push(sum.trim());
      if (events.length >= 5) break;
    }
    if (!events.length) return { ok: true, signals: [{ source: 'Calendar', text: 'ICS loaded — no upcoming SUMMARY found', score: 3 }] };
    return { ok: true, signals: events.map((t) => ({ source: 'Calendar', text: t, score: 6 })) };
  } catch (err) {
    return { ok: false, signals: [{ source: 'Calendar', text: `[error] ${err.message}`, score: 3 }], warning: 'ICS fetch failed' };
  }
}
