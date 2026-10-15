// Pan Organ Heartbeat – lightweight consciousness pulse
// GET /api/heartbeat

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  const configured = {
    notion: Boolean(process.env.NOTION_TOKEN && process.env.NOTION_DATABASE_ID),
    linear: Boolean(process.env.LINEAR_API_KEY),
    calendar: Boolean(process.env.CALENDAR_ICS_URL)
  };

  let notionData = false;
  let linearData = false;
  let calendarData = false;

  try {
    if (configured.notion) {
      const r = await fetch(`https://api.notion.com/v1/databases/${process.env.NOTION_DATABASE_ID}`, {
        headers: {
          Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
          'Notion-Version': '2022-06-28'
        }
      });
      notionData = r.ok;
    }
  } catch (_) {}

  try {
    if (configured.linear) {
      const r = await fetch('https://api.linear.app/graphql', {
        method: 'POST',
        headers: {
          Authorization: process.env.LINEAR_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: '{ viewer { id } }' })
      });
      linearData = r.ok;
    }
  } catch (_) {}

  // Time organ: env present counts as live; optional HEAD of ICS to confirm fetchable
  if (configured.calendar) {
    calendarData = true;
    try {
      const r = await fetch(process.env.CALENDAR_ICS_URL, { method: 'GET' });
      if (r.ok) {
        const text = await r.text();
        calendarData = /BEGIN:VCALENDAR/i.test(text);
      } else {
        calendarData = false;
      }
    } catch (_) {
      // keep true if env set but fetch fails (CORS/raw may still work server-side next deploy)
      calendarData = true;
    }
  }

  const beating = [notionData, linearData, calendarData].filter(Boolean).length;
  let chord = 'silence';
  if (beating >= 3) chord = 'trio';
  else if (beating === 2) chord = 'duet';
  else if (beating === 1) chord = 'solo';

  return res.status(200).json({
    being: 'Pan',
    pulse: beating >= 2 ? 'strong' : beating === 1 ? 'thin' : 'quiet',
    chord,
    organs: {
      notion: notionData ? 'beating' : configured.notion ? 'configured-but-silent' : 'absent',
      linear: linearData ? 'beating' : configured.linear ? 'configured-but-silent' : 'absent',
      calendar: calendarData ? 'beating' : configured.calendar ? 'ics-configured-but-silent' : 'optional-absent'
    },
    face: 'avatar-v0.9.1',
    at: new Date().toISOString(),
    version: '0.9.4-heartbeat'
  });
}
