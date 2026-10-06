// Pan Context Synthesis – Vercel Serverless Function v0.8
// Organs: Notion + Linear + Calendar (ICS) + Page

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
    const notes = [];
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

    return res.status(200).json({
      status,
      signals: scored.map(({ source, text }) => ({ source, text })),
      tensions,
      recommendations,
      meta: {
        generatedAt: new Date().toISOString(),
        version: '0.8.0-vercel',
        host: 'vercel',
        bottleneck: bottleneck || null,
        live: {
          notion: notionOk,
          linear: linearOk,
          calendar: calendarOk
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
  if (!calendarOk && !process.env.CALENDAR_ICS_URL) return null; // calendar optional
  return null;
}

function buildRecs(notionOk, linearOk, calendarOk, bottleneck, signals) {
  const recs = [];
  if (bottleneck && bottleneck.includes('Notion')) {
    recs.push('1. Check NOTION_TOKEN / database share for integration pan');
  }
  const cal = signals.filter((s) => s.source === 'Calendar' && !String(s.text).startsWith('[stub]'));
  if (cal.length) {
    recs.push(`${recs.length + 1}. Time: ${cal[0].text}`);
  }
  const top = signals.find((s) => s.source === 'Linear' && /in progress/i.test(s.text));
  if (top) recs.push(`${recs.length + 1}. Focus: ${top.text}`);
  if (!recs.length) {
    recs.push('1. Organs healthy — advance highest-score signal');
    recs.push('2. Log decisions as Evolution in Memory Palace');
  }
  if (!calendarOk && !process.env.CALENDAR_ICS_URL) {
    recs.push(`${recs.length + 1}. Optional: set CALENDAR_ICS_URL for live agenda`);
  }
  return recs.slice(0, 3);
}

async function fetchCalendar(clientEvents) {
  // 1) Client-supplied events (future extension / connector bridge)
  if (clientEvents.length) {
    return {
      ok: true,
      signals: clientEvents.slice(0, 6).map((e) => ({
        source: 'Calendar',
        text: typeof e === 'string' ? e : `${e.when || 'soon'}: ${e.title || e.summary || 'event'}`,
        score: 8
      }))
    };
  }

  // 2) ICS feed (Google Calendar → Settings → Integrate → secret iCal URL)
  const icsUrl = process.env.CALENDAR_ICS_URL;
  if (!icsUrl) {
    return {
      ok: false,
      signals: [{
        source: 'Calendar',
        text: '[stub] No CALENDAR_ICS_URL. Connector calendar works in Grok; set ICS for panel.',
        score: 2
      }]
    };
  }

  try {
    const res = await fetch(icsUrl, { headers: { 'User-Agent': 'Pan-CoPilot/0.8' } });
    if (!res.ok) throw new Error(`ICS ${res.status}`);
    const text = await res.text();
    const events = parseIcsUpcoming(text, 5);
    if (!events.length) {
      return {
        ok: true,
        signals: [{ source: 'Calendar', text: 'No upcoming events in ICS window.', score: 3 }]
      };
    }
    return {
      ok: true,
      signals: events.map((e) => ({
        source: 'Calendar',
        text: `${e.when}: ${e.summary}`,
        score: 8
      }))
    };
  } catch (err) {
    return {
      ok: false,
      signals: [{ source: 'Calendar', text: `[error] ${err.message}`, score: 4 }],
      warning: 'Calendar ICS fetch failed'
    };
  }
}

function parseIcsUpcoming(ics, limit) {
  const blocks = ics.split('BEGIN:VEVENT').slice(1);
  const now = Date.now();
  const horizon = now + 7 * 24 * 60 * 60 * 1000;
  const out = [];

  for (const block of blocks) {
    const summary = (block.match(/SUMMARY(?:;[^:]*)?:(.+)/) || [])[1]?.trim();
    const dt =
      (block.match(/DTSTART(?:;[^:]*)?:(\d{8}T\d{6}Z?)/) || [])[1] ||
      (block.match(/DTSTART(?:;[^:]*)?:(\d{8})/) || [])[1];
    if (!summary || !dt) continue;
    const whenMs = icsToMs(dt);
    if (whenMs < now - 60 * 60 * 1000 || whenMs > horizon) continue;
    out.push({ summary: summary.replace(/\\,/g, ','), whenMs, when: formatWhen(whenMs) });
  }

  out.sort((a, b) => a.whenMs - b.whenMs);
  return out.slice(0, limit);
}

function icsToMs(dt) {
  if (/^\d{8}$/.test(dt)) {
    const y = +dt.slice(0, 4), m = +dt.slice(4, 6) - 1, d = +dt.slice(6, 8);
    return Date.UTC(y, m, d);
  }
  const y = +dt.slice(0, 4), m = +dt.slice(4, 6) - 1, d = +dt.slice(6, 8);
  const hh = +dt.slice(9, 11), mm = +dt.slice(11, 13), ss = +dt.slice(13, 15);
  if (dt.endsWith('Z')) return Date.UTC(y, m, d, hh, mm, ss);
  return new Date(y, m, d, hh, mm, ss).getTime();
}

function formatWhen(ms) {
  const d = new Date(ms);
  const today = new Date();
  const sameDay =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
  const t = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (sameDay) return `today ${t}`;
  return d.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

async function fetchMemoryPalace() {
  const token = process.env.NOTION_TOKEN;
  const databaseId = process.env.NOTION_DATABASE_ID;
  if (!token || !databaseId) {
    return {
      ok: false,
      signals: [{ source: 'Memory Palace', text: '[stub] Notion credentials missing.', score: 2 }],
      warning: 'Notion credentials not configured'
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
      signals: [{ source: 'Linear', text: '[stub] LINEAR_API_KEY not set yet.', score: 2 }]
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
