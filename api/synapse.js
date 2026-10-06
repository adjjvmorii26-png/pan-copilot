// GET /api/synapse — pure organ coherence pulse (unique integration layer)
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Reuse synthesize path via internal logic would be ideal; lightweight probe here
  const notion = Boolean(process.env.NOTION_TOKEN && process.env.NOTION_DATABASE_ID);
  const linear = Boolean(process.env.LINEAR_API_KEY);
  let notionOk = false, linearOk = false;
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

  let coherence = 0;
  if (notionOk) coherence += 40;
  if (linearOk) coherence += 40;
  if (process.env.CALENDAR_ICS_URL) coherence += 10;
  const chord = notionOk && linearOk ? 'duet' : notionOk || linearOk ? 'solo' : 'silence';
  const phrase = chord === 'duet' ? 'Memory ⟷ Linear cord lit' : chord === 'solo' ? 'single organ singing' : 'seeking signal';

  return res.status(200).json({
    being: 'Pan',
    layer: 'synapse',
    coherence,
    chord,
    phrase,
    myth: coherence >= 70 ? 'constellation locked' : coherence >= 40 ? 'stars aligning' : 'seeking signal',
    live: { notion: notionOk, linear: linearOk },
    at: new Date().toISOString(),
    version: '0.9.0-synapse'
  });
}
