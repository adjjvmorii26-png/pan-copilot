// GET /api/synapse — pure organ coherence pulse (true trio scoring)
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(200).end();

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

  // Equal weight: Memory 35 · Nerves 35 · Time 30 (trio = 100)
  let coherence = 0;
  if (notionOk) coherence += 35;
  if (linearOk) coherence += 35;
  if (calendarOk) coherence += 30;

  const beating = [notionOk, linearOk, calendarOk].filter(Boolean).length;
  let chord = 'silence';
  if (beating >= 3) chord = 'trio';
  else if (beating === 2) chord = 'duet';
  else if (beating === 1) chord = 'solo';

  const phrases = {
    trio: 'Memory ⟷ Linear ⟷ Time — full constellation',
    duet: notionOk && linearOk ? 'Memory ⟷ Linear cord lit' : notionOk && calendarOk ? 'Memory ⟷ Time cord lit' : 'Linear ⟷ Time cord lit',
    solo: 'single organ singing',
    silence: 'seeking signal'
  };

  return res.status(200).json({
    being: 'Pan',
    layer: 'synapse',
    coherence,
    chord,
    phrase: phrases[chord],
    myth: coherence >= 90 ? 'constellation locked' : coherence >= 70 ? 'stars aligning' : coherence >= 35 ? 'first light' : 'seeking signal',
    live: { notion: notionOk, linear: linearOk, calendar: calendarOk },
    at: new Date().toISOString(),
    version: '0.9.4-synapse'
  });
}
