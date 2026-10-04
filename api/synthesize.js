// Pan – Context Synthesis API (Vercel)
// POST /api/synthesize
// Env: NOTION_TOKEN, NOTION_DATABASE_ID, LINEAR_API_KEY (optional)

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
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

    signals.push({
      source: 'Page',
      text: pageTitle || pageUrl || 'unknown page'
    });

    return res.status(200).json({
      status: buildStatus(query, signals, notes),
      signals,
      tensions,
      recommendations: buildRecommendations(notes),
      meta: {
        generatedAt: new Date().toISOString(),
        version: '0.6.0-vercel',
        host: 'vercel',
        organsQueried: focus,
        live: {
          notion: Boolean(process.env.NOTION_TOKEN && process.env.NOTION_DATABASE_ID),
          linear: Boolean(process.env.LINEAR_API_KEY)
        }
      }
    });
  } catch (err) {
    console.error('[Pan synthesize]', err);
    return res.status(500).json({
      error: 'Synthesis failed',
      message: err.message,
      status: 'Pan hit an error while synthesizing.'
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
      note: 'set NOTION_TOKEN + NOTION_DATABASE_ID'
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
      const errText = await res.text();
      throw new Error(`Notion ${res.status}: ${errText.slice(0, 180)}`);
    }

    const data = await res.json();
    const signals = (data.results || []).map((page) => {
      const title = extractTitle(page);
      const type = page.properties?.Type?.select?.name || 'Entry';
      const status = page.properties?.Status?.select?.name || '';
      return {
        source: 'Memory Palace',
        text: `${type}${status ? ` (${status})` : ''}: ${title}`
      };
    });

    if (signals.length === 0) {
      signals.push({ source: 'Memory Palace', text: 'No Active/High entries returned.' });
    }

    return { signals };
  } catch (err) {
    console.error('Notion error', err);
    return {
      signals: [{ source: 'Memory Palace', text: `[error] ${err.message}` }],
      warning: 'Notion query failed'
    };
  }
}

function extractTitle(page) {
  const prop = page.properties?.Name || page.properties?.title;
  if (!prop) return 'Untitled';
  const rich = prop.title || prop.rich_text || [];
  return rich.map((t) => t.plain_text).join('') || 'Untitled';
}

async function fetchLinearIssues() {
  const apiKey = process.env.LINEAR_API_KEY;
  if (!apiKey) {
    return {
      signals: [{ source: 'Linear', text: '[stub] LINEAR_API_KEY not set yet.' }],
      warning: 'Linear credentials not configured',
      note: 'set LINEAR_API_KEY'
    };
  }

  try {
    const query = `query {
      issues(
        filter: {
          project: { name: { containsIgnoreCase: "Pan" } }
          state: { type: { nin: ["completed", "canceled"] } }
        }
        first: 8
        orderBy: updatedAt
      ) {
        nodes { identifier title state { name } }
      }
    }`;

    const res = await fetch('https://api.linear.app/graphql', {
      method: 'POST',
      headers: { Authorization: apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Linear ${res.status}: ${errText.slice(0, 180)}`);
    }

    const data = await res.json();
    if (data.errors) throw new Error(data.errors[0]?.message || 'Linear GraphQL error');

    const nodes = data.data?.issues?.nodes || [];
    const signals = nodes.map((i) => ({
      source: 'Linear',
      text: `${i.identifier} [${i.state?.name || '?'}] ${i.title}`
    }));

    if (signals.length === 0) {
      signals.push({ source: 'Linear', text: 'No open issues in Pan project.' });
    }

    return { signals };
  } catch (err) {
    console.error('Linear error', err);
    return {
      signals: [{ source: 'Linear', text: `[error] ${err.message}` }],
      warning: 'Linear query failed'
    };
  }
}

function buildStatus(query, signals, notes) {
  const live = signals.filter(
    (s) => !s.text.startsWith('[stub]') && !s.text.startsWith('[error]')
  ).length;
  const base = query ? `Synthesis for "${query}".` : 'General status synthesis.';
  return `${base} ${live} live signal(s). ${notes.join(' · ')}`.trim();
}

function buildRecommendations(notes) {
  const recs = [];
  if (notes.some((n) => n.includes('NOTION'))) {
    recs.push('1. Notion credentials look incomplete');
  }
  if (notes.some((n) => n.includes('LINEAR'))) {
    recs.push(`${recs.length + 1}. Add LINEAR_API_KEY for live tasks`);
  }
  if (recs.length === 0) {
    recs.push('1. Configured organs responded');
    recs.push('2. Live data is flowing');
  }
  return recs;
}
