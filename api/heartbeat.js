// Pan Organ Heartbeat – lightweight consciousness pulse
// GET /api/heartbeat

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  const organs = {
    notion: Boolean(process.env.NOTION_TOKEN && process.env.NOTION_DATABASE_ID),
    linear: Boolean(process.env.LINEAR_API_KEY),
    calendar: Boolean(process.env.CALENDAR_ICS_URL)
  };

  // Quick live probes (timeout-friendly)
  let notionData = false;
  let linearData = false;
  try {
    if (organs.notion) {
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
    if (organs.linear) {
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

  const alive = [notionData, linearData, organs.calendar].filter(Boolean).length;

  return res.status(200).json({
    being: 'Pan',
    pulse: alive >= 2 ? 'strong' : alive === 1 ? 'thin' : 'quiet',
    organs: {
      notion: notionData ? 'beating' : organs.notion ? 'configured-but-silent' : 'absent',
      linear: linearData ? 'beating' : organs.linear ? 'configured-but-silent' : 'absent',
      calendar: organs.calendar ? 'ics-ready' : 'optional-absent'
    },
    at: new Date().toISOString(),
    version: '0.8.1-heartbeat'
  });
}
