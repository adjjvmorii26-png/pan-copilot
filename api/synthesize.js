// Pan Context Synthesis – Vercel Serverless Function v0.7
// Intelligence: signal scoring, bottleneck bias, organ gap awareness

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

    const signals = [];
    const tensions = [];
    const notes = [];
    let notionOk = false;
    let linearOk = false;

    if (focus.includes('memory')) {
      const memory = await fetchMemoryPalace();
      signals.push(...memory.signals);
      if (memory.warning) tensions.push(memory.warning);
      if (memory.note) notes.push(memory.note);
      notionOk = memory.ok;
    }

    if (focus.includes('tasks')) {
      const tasks = await fetchLinearIssues();
      signals.push(...tasks.signals);
      if (tasks.warning) tensions.push(tasks.warning);
      if (tasks.note) notes.push(tasks.note);
      linearOk = tasks.ok;
    }

    if (focus.includes('calendar')) {
      signals.push({
        source: 'Calendar',
        text: 'Calendar still stubbed.',
        score: 1
      });
    }

    signals.push({
      source: 'Page',
      text: pageTitle || pageUrl || 'unknown page',
      score: 2
    });

    // Intelligence layer: sort by score, detect bottleneck
    const scored = signals
      .map((s) => ({ ...s, score: s.score ?? scoreSignal(s) }))
      .sort((a, b) => b.score - a.score);

    const bottleneck = findBottleneck(notionOk, linearOk, scored, tensions);
    const recommendations = buildRecs(notes, notionOk, linearOk, bottleneck, scored);

    const liveCount = scored.filter(
      (s) => !String(s.text).startsWith('[stub]') && !String(s.text).startsWith('[error]')
    ).length;

    let status = query
      ? `Synthesis for "${query}". ${liveCount} live signal(s).`
      : `General status. ${liveCount} live signal(s).`;
    if (bottleneck) status += ` Bottleneck: ${bottleneck}`;

    return res.status(200).json({
      status,
      signals: scored.map(({ source, text }) => ({ source, text })),
      tensions,
      recommendations,
      meta: {
        generatedAt: new Date().toISOString(),
        version: '0.7.0-vercel',
        host: 'vercel',
        bottleneck: bottleneck || null,
        live: {
          notion: Boolean(process.env.NOTION_TOKEN && process.env.NOTION_DATABASE_ID),
          notionData: notionOk,
          linear: linearOk
        }
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
  if (t.includes('blocked') || t.includes('404') || t.includes('share')) score += 2;
  return score;
}

function findBottleneck(notionOk, linearOk, signals, tensions) {
  if (!notionOk && process.env.NOTION_TOKEN) {
    return 'Notion integration L not shared with Memory Palace database';
  }
  if (!linearOk && !process.env.LINEAR_API_KEY) {
    return 'LINEAR_API_KEY missing';
  }
  const inProg = signals.filter((s) => /\[in progress\]/i.test(s.text));
  if (inProg.length >= 2) {
    return `Multiple In Progress issues (${inProg.length}) — finish or park one`;
  }
  if (tensions.length && !notionOk) return tensions[0];
  return null;
}

function buildRecs(notes, notionOk, linearOk, bottleneck, signals) {
  const recs = [];
  if (bottleneck && bottleneck.includes('integration L')) {
    recs.push('1. Notion: open Memory Palace → ••• → Connections → connect integration L');
  }
  if (!linearOk) recs.push(`${recs.length + 1}. Set LINEAR_API_KEY on Vercel and redeploy`);
  const top = signals.find((s) => s.source === 'Linear' && /in progress/i.test(s.text));
  if (top) recs.push(`${recs.length + 1}. Focus Linear: ${top.text.replace(/^[^\]]+\]\s*/, '')}`);
  if (!recs.length) {
    recs.push('1. Organs healthy — pick highest-score signal and advance it');
    recs.push('2. Log any decision as Evolution in Memory Palace');
  }
  return recs.slice(0, 3);
}

async function fetchMemoryPalace() {
  const token = process.env.NOTION_TOKEN;
  const databaseId = process.env.NOTION_DATABASE_ID;
  if (!token || !databaseId) {
    return {
      ok: false,
      signals: [{ source: 'Memory Palace', text: '[stub] Notion credentials missing.', score: 2 }],
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
      return {
        source: 'Memory Palace',
        text: `${type}${status ? ` (${status})` : ''}: ${title}`,
        score: 7
      };
    });
    if (!signals.length) {
      signals.push({ source: 'Memory Palace', text: 'No Active/High entries.', score: 3 });
    }
    return { ok: true, signals };
  } catch (err) {
    return {
      ok: false,
      signals: [{ source: 'Memory Palace', text: `[error] ${err.message}`, score: 8 }],
      warning: 'Notion query failed'
    };
  }
}

async function fetchLinearIssues() {
  const apiKey = process.env.LINEAR_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      signals: [{ source: 'Linear', text: '[stub] LINEAR_API_KEY not set yet.', score: 2 }],
      note: 'LINEAR'
    };
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
      return {
        source: 'Linear',
        text: `${i.identifier} [${state}] ${i.title}`,
        score
      };
    });
    if (!signals.length) {
      signals.push({ source: 'Linear', text: 'No open issues in Pan project.', score: 3 });
    }
    return { ok: true, signals };
  } catch (err) {
    return {
      ok: false,
      signals: [{ source: 'Linear', text: `[error] ${err.message}`, score: 4 }],
      warning: 'Linear query failed'
    };
  }
}
