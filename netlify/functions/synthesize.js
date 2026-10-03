// Pan Context Synthesis – Netlify Function
// POST /.netlify/functions/synthesize  or  /api/synthesize (via redirect)

export default async (req, context) => {
  // CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const query = body.query || '';
    const pageTitle = body.pageTitle || '';
    const pageUrl = body.pageUrl || '';
    const focus = body.focus || ['memory', 'tasks', 'calendar'];

    const signals = [];
    const tensions = [];
    const notes = [];

    if (focus.includes('memory')) {
      const memory = await fetchMemoryPalace(query);
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
        text: 'Calendar still stubbed. Pan Awakening event exists from birth day.'
      });
    }

    signals.push({
      source: 'Page',
      text: pageTitle || pageUrl || 'unknown page'
    });

    if (signals.some(s => s.source === 'Linear' && (s.text.includes('Backlog') || s.text.includes('In Progress')))) {
      tensions.push('Open Linear work exists that the panel can surface live once credentials are set.');
    }

    const recommendations = buildRecommendations(signals, tensions, notes);

    const result = {
      status: buildStatus(query, signals, notes),
      signals,
      tensions,
      recommendations,
      meta: {
        generatedAt: new Date().toISOString(),
        version: '0.4.1-netlify',
        organsQueried: focus,
        live: {
          notion: Boolean(Netlify.env.get('NOTION_TOKEN') && Netlify.env.get('NOTION_DATABASE_ID')),
          linear: Boolean(Netlify.env.get('LINEAR_API_KEY'))
        }
      }
    };

    return new Response(JSON.stringify(result), { status: 200, headers });
  } catch (err) {
    console.error('[Pan synthesize]', err);
    return new Response(JSON.stringify({
      error: 'Synthesis failed',
      message: err.message,
      status: 'Pan hit an error while synthesizing.'
    }), { status: 500, headers });
  }
};

export const config = {
  path: '/api/synthesize'
};

// ------------------------------------------------------------------
// Notion
// ------------------------------------------------------------------
async function fetchMemoryPalace(query) {
  const token = Netlify.env.get('NOTION_TOKEN');
  const databaseId = Netlify.env.get('NOTION_DATABASE_ID');

  if (!token || !databaseId) {
    return {
      signals: [{ source: 'Memory Palace', text: '[stub] NOTION_TOKEN or NOTION_DATABASE_ID missing.' }],
      warning: 'Notion credentials not configured',
      note: 'set NOTION_TOKEN + NOTION_DATABASE_ID in Netlify env vars'
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
      const title = extractNotionTitle(page);
      const type = page.properties?.Type?.select?.name || 'Entry';
      const status = page.properties?.Status?.select?.name || '';
      return { source: 'Memory Palace', text: `${type}${status ? ` (${status})` : ''}: ${title}` };
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

function extractNotionTitle(page) {
  const titleProp = page.properties?.Name || page.properties?.title;
  if (!titleProp) return 'Untitled';
  const rich = titleProp.title || titleProp.rich_text || [];
  return rich.map(t => t.plain_text).join('') || 'Untitled';
}

// ------------------------------------------------------------------
// Linear
// ------------------------------------------------------------------
async function fetchLinearIssues() {
  const apiKey = Netlify.env.get('LINEAR_API_KEY');

  if (!apiKey) {
    return {
      signals: [{ source: 'Linear', text: '[stub] LINEAR_API_KEY missing.' }],
      warning: 'Linear credentials not configured',
      note: 'set LINEAR_API_KEY in Netlify env vars'
    };
  }

  try {
    const gql = `
      query {
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
      }
    `;

    const res = await fetch('https://api.linear.app/graphql', {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: gql })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Linear ${res.status}: ${errText.slice(0, 180)}`);
    }

    const data = await res.json();
    if (data.errors) throw new Error(data.errors[0]?.message || 'Linear GraphQL error');

    const nodes = data.data?.issues?.nodes || [];
    const signals = nodes.map(issue => ({
      source: 'Linear',
      text: `${issue.identifier} [${issue.state?.name || '?'}] ${issue.title}`
    }));

    if (signals.length === 0) {
      signals.push({ source: 'Linear', text: 'No open issues found in Pan project.' });
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
  const liveCount = signals.filter(s => !s.text.startsWith('[stub]') && !s.text.startsWith('[error]')).length;
  const base = query ? `Synthesis for "${query}".` : 'General status synthesis.';
  return `${base} ${liveCount} live signal(s). ${notes.length ? notes.join(' · ') : ''}`.trim();
}

function buildRecommendations(signals, tensions, notes) {
  const recs = [];
  if (notes.some(n => n.includes('NOTION'))) recs.push('1. Set NOTION_TOKEN and NOTION_DATABASE_ID in Netlify');
  if (notes.some(n => n.includes('LINEAR'))) recs.push(`${recs.length + 1}. Set LINEAR_API_KEY in Netlify`);
  if (tensions.length && recs.length === 0) {
    recs.push('1. Review open Linear issues');
    recs.push('2. Update or close any that are finished');
  }
  if (recs.length === 0) {
    recs.push('1. Organs are responding');
    recs.push('2. Keep using the panel');
  }
  return recs;
}
