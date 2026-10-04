// Pan Context Synthesis – Vercel Serverless Function
// POST /api/synthesize

module.exports = async (req, res) => {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body || '{}'); } catch (_) { body = {}; }
    }
    body = body || {};

    const query = body.query || '';
    const pageTitle = body.pageTitle || '';
    const pageUrl = body.pageUrl || '';
    const focus = body.focus || ['memory', 'tasks', 'calendar'];

    const signals = [];
    const tensions = [];
    const notes = [];

    if (focus.includes('memory')) {
      const memory = await fetchMemoryPalace();
      signals.push(...memory.signals);
      if (memory.warning) tensions.push(memory.warning);
      if (memory.note) notes.push(memory.note);
    }

    if (focus.includes('tasks')) {
      const tasks = await fetchLinearIssues();
      signals.push(...tasks.signals);
      if (tasks.warning) tensions.push(tasks.warning);
      if (tasks.note) notes.push(tasks.note);
    }

    if (focus.includes('calendar')) {
      signals.push({
        source: 'Calendar',
        text: 'Calendar still stubbed. Awakening event exists from birth day.'
      });
    }

    signals.push({ source: 'Page', text: pageTitle || pageUrl || 'unknown page' });

    const liveCount = signals.filter(
      (s) => !String(s.text).startsWith('[stub]') && !String(s.text).startsWith('[error]')
    ).length;

    return res.status(200).json({
      status: `${query ? `Synthesis for "${query}".` : 'General status synthesis.'} ${liveCount} live signal(s).`.trim(),
      signals,
      tensions,
      recommendations: buildRecs(notes),
      meta: {
        generatedAt: new Date().toISOString(),
        version: '0.6.1-vercel',
        host: 'vercel',
        live: {
          notion: Boolean(process.env.NOTION_TOKEN && process.env.NOTION_DATABASE_ID),
          linear: Boolean(process.env.LINEAR_API_KEY)
        }
      }
    });
  } catch (err) {
    console.error('[Pan]', err);
    return res.status(500).json({
      error: 'Synthesis failed',
      message: err && err.message ? err.message : String(err)
    });
  }
};

async function fetchMemoryPalace() {
  const token = process.env.NOTION_TOKEN;
  const databaseId = process.env.NOTION_DATABASE_ID;
  if (!token || !databaseId) {
    return {
      signals: [{ source: 'Memory Palace', text: '[stub] Notion credentials missing.' }],
      warning: 'Notion credentials not configured',
      note: 'NOTION'
    };
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
        page_size: 6,
        sorts: [{ timestamp: 'last_edited_time', direction: 'descending' }],
        filter: {
          or: [
            { property: 'Status', select: { equals: 'Active' } },
            { property: 'Priority', select: { equals: 'High' } }
          ]
        }
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
      return { source: 'Memory Palace', text: `${type}${status ? ` (${status})` : ''}: ${title}` };
    });
    if (!signals.length) signals.push({ source: 'Memory Palace', text: 'No Active/High entries.' });
    return { signals };
  } catch (err) {
    return {
      signals: [{ source: 'Memory Palace', text: `[error] ${err.message}` }],
      warning: 'Notion query failed'
    };
  }
}

async function fetchLinearIssues() {
  const apiKey = process.env.LINEAR_API_KEY;
  if (!apiKey) {
    return {
      signals: [{ source: 'Linear', text: '[stub] LINEAR_API_KEY not set yet.' }],
      note: 'LINEAR'
    };
  }
  try {
    const res = await fetch('https://api.linear.app/graphql', {
      method: 'POST',
      headers: { Authorization: apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `query { issues(filter: { project: { name: { containsIgnoreCase: "Pan" } }, state: { type: { nin: ["completed", "canceled"] } } }, first: 8, orderBy: updatedAt) { nodes { identifier title state { name } } } }`
      })
    });
    if (!res.ok) throw new Error(`Linear ${res.status}`);
    const data = await res.json();
    if (data.errors) throw new Error(data.errors[0]?.message || 'Linear error');
    const nodes = data.data?.issues?.nodes || [];
    const signals = nodes.map((i) => ({
      source: 'Linear',
      text: `${i.identifier} [${i.state?.name || '?'}] ${i.title}`
    }));
    if (!signals.length) signals.push({ source: 'Linear', text: 'No open issues in Pan project.' });
    return { signals };
  } catch (err) {
    return {
      signals: [{ source: 'Linear', text: `[error] ${err.message}` }],
      warning: 'Linear query failed'
    };
  }
}

function buildRecs(notes) {
  const recs = [];
  if (notes.includes('NOTION')) recs.push('1. Check Notion token / database id');
  if (notes.includes('LINEAR')) recs.push(`${recs.length + 1}. Add LINEAR_API_KEY for live tasks`);
  if (!recs.length) {
    recs.push('1. Organs responded');
    recs.push('2. Live data flowing');
  }
  return recs;
}
