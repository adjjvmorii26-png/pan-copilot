// Pan – Context Synthesis Backend (Netlify Function)
// POST /.netlify/functions/synthesize
// Version 0.5.1 – redeploy for env var pickup
//
// Env vars:
//   NOTION_TOKEN
//   NOTION_DATABASE_ID
//   LINEAR_API_KEY (optional)

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
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

    const recommendations = buildRecommendations(notes, tensions);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: buildStatus(query, signals, notes),
        signals,
        tensions,
        recommendations,
        meta: {
          generatedAt: new Date().toISOString(),
          version: '0.5.1',
          organsQueried: focus,
          live: {
            notion: Boolean(process.env.NOTION_TOKEN && process.env.NOTION_DATABASE_ID),
            linear: Boolean(process.env.LINEAR_API_KEY)
          }
        }
      })
    };
  } catch (err) {
    console.error('[Pan synthesize]', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Synthesis failed',
        message: err.message,
        status: 'Pan hit an error while synthesizing.'
      })
    };
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
        'Authorization': `Bearer ${token}`,
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
    const signals = (data.results || []).map(page => {
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
  return rich.map(t => t.plain_text).join('') || 'Untitled';
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
        nodes {
          identifier
          title
          state { name }
        }
      }
    }`;

    const res = await fetch('https://api.linear.app/graphql', {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Linear ${res.status}: ${errText.slice(0, 180)}`);
    }

    const data = await res.json();
    if (data.errors) throw new Error(data.errors[0]?.message || 'Linear GraphQL error');

    const nodes = data.data?.issues?.nodes || [];
    const signals = nodes.map(i => ({
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
  const live = signals.filter(s => !s.text.startsWith('[stub]') && !s.text.startsWith('[error]')).length;
  const base = query ? `Synthesis for "${query}".` : 'General status synthesis.';
  return `${base} ${live} live signal(s). ${notes.join(' · ')}`.trim();
}

function buildRecommendations(notes, tensions) {
  const recs = [];
  if (notes.some(n => n.includes('NOTION'))) {
    recs.push('1. Notion credentials look incomplete – check env vars');
  }
  if (notes.some(n => n.includes('LINEAR'))) {
    recs.push(`${recs.length + 1}. Add LINEAR_API_KEY for live tasks`);
  }
  if (recs.length === 0) {
    recs.push('1. Configured organs responded');
    recs.push('2. Live data is flowing – keep using the panel');
  }
  return recs;
}
