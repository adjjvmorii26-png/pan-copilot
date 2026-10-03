// Pan – Context Synthesis API
// Vercel Serverless Function
// POST /api/synthesize
//
// Env vars required for live data:
//   NOTION_TOKEN
//   NOTION_DATABASE_ID          (Pan Memory Palace database id)
//   LINEAR_API_KEY
//
// Optional:
//   LINEAR_PROJECT_ID           (defaults to looking up by name)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = req.body || {};
    const query = body.query || '';
    const pageTitle = body.pageTitle || '';
    const pageUrl = body.pageUrl || '';
    const focus = body.focus || ['memory', 'tasks', 'calendar'];

    const signals = [];
    const tensions = [];
    const notes = [];

    // ---- Memory Palace (Notion) ----
    if (focus.includes('memory')) {
      const memory = await fetchMemoryPalace(query);
      signals.push(...memory.signals);
      if (memory.warning) tensions.push(memory.warning);
      if (memory.note) notes.push(memory.note);
    }

    // ---- Linear tasks ----
    if (focus.includes('tasks')) {
      const tasks = await fetchLinearIssues();
      signals.push(...tasks.signals);
      if (tasks.warning) tensions.push(tasks.warning);
      if (tasks.note) notes.push(tasks.note);
    }

    // ---- Calendar (still stub for now) ----
    if (focus.includes('calendar')) {
      signals.push({
        source: 'Calendar',
        text: 'Calendar integration still stubbed. Pan Awakening event exists from birth day.'
      });
    }

    // Always include current page
    signals.push({
      source: 'Page',
      text: pageTitle || pageUrl || 'unknown page'
    });

    // Derive simple tensions
    if (signals.some(s => s.source === 'Linear' && (s.text.includes('Backlog') || s.text.includes('In Progress')))) {
      tensions.push('Open Linear work exists that the panel can now surface live once deployed.');
    }

    const recommendations = buildRecommendations(signals, tensions, notes);

    return res.status(200).json({
      status: buildStatus(query, signals, notes),
      signals,
      tensions,
      recommendations,
      meta: {
        generatedAt: new Date().toISOString(),
        version: '0.4.0',
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
      status: 'Pan hit an error while synthesizing. Check function logs.'
    });
  }
}

// ------------------------------------------------------------------
// Notion – Memory Palace
// ------------------------------------------------------------------
async function fetchMemoryPalace(query) {
  const token = process.env.NOTION_TOKEN;
  const databaseId = process.env.NOTION_DATABASE_ID;

  if (!token || !databaseId) {
    return {
      signals: [{
        source: 'Memory Palace',
        text: '[stub] NOTION_TOKEN or NOTION_DATABASE_ID missing. Using placeholder.'
      }],
      warning: 'Notion credentials not configured – Memory Palace is stubbed',
      note: 'set NOTION_TOKEN + NOTION_DATABASE_ID'
    };
  }

  try {
    // Query the database for the most recent Active / high-priority items
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
      throw new Error(`Notion ${res.status}: ${errText.slice(0, 200)}`);
    }

    const data = await res.json();
    const signals = (data.results || []).map(page => {
      const title = extractNotionTitle(page);
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
  const apiKey = process.env.LINEAR_API_KEY;

  if (!apiKey) {
    return {
      signals: [{
        source: 'Linear',
        text: '[stub] LINEAR_API_KEY missing. Using placeholder.'
      }],
      warning: 'Linear credentials not configured – tasks are stubbed',
      note: 'set LINEAR_API_KEY'
    };
  }

  try {
    const query = `
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
            priority
            state { name type }
            url
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
      body: JSON.stringify({ query })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Linear ${res.status}: ${errText.slice(0, 200)}`);
    }

    const data = await res.json();
    if (data.errors) {
      throw new Error(data.errors[0]?.message || 'Linear GraphQL error');
    }

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

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------
function buildStatus(query, signals, notes) {
  const liveCount = signals.filter(s => !s.text.startsWith('[stub]') && !s.text.startsWith('[error]')).length;
  const base = query
    ? `Synthesis for "${query}".`
    : 'General status synthesis.';
  return `${base} ${liveCount} live signal(s). ${notes.length ? notes.join(' · ') : ''}`.trim();
}

function buildRecommendations(signals, tensions, notes) {
  const recs = [];

  if (notes.some(n => n.includes('NOTION'))) {
    recs.push('1. Set NOTION_TOKEN and NOTION_DATABASE_ID in the deployment environment');
  }
  if (notes.some(n => n.includes('LINEAR'))) {
    recs.push(`${recs.length + 1}. Set LINEAR_API_KEY so tasks become live`);
  }
  if (tensions.length && recs.length === 0) {
    recs.push('1. Review open Linear issues surfaced above');
    recs.push('2. Consider closing or updating any that are done');
  }
  if (recs.length === 0) {
    recs.push('1. All configured organs responded');
    recs.push('2. Continue using the panel — live data is flowing');
  }

  return recs;
}
