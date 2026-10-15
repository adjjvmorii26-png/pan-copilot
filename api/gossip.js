// GET/POST /api/gossip — organ disagreements as ranked signal
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const gossip = [];
  let notionOk = false, linearOk = false;
  const hasNotion = Boolean(process.env.NOTION_TOKEN && process.env.NOTION_DATABASE_ID);
  const hasLinear = Boolean(process.env.LINEAR_API_KEY);
  const hasCal = Boolean(process.env.CALENDAR_ICS_URL);

  try {
    if (hasNotion) {
      const r = await fetch(`https://api.notion.com/v1/databases/${process.env.NOTION_DATABASE_ID}`, {
        headers: { Authorization: `Bearer ${process.env.NOTION_TOKEN}`, 'Notion-Version': '2022-06-28' }
      });
      notionOk = r.ok;
      if (!r.ok) gossip.push({ risk: 8, line: 'Memory configured but silent — token or share may be wrong' });
    } else {
      gossip.push({ risk: 6, line: 'Memory absent — no NOTION_TOKEN / DATABASE_ID' });
    }
  } catch (e) {
    gossip.push({ risk: 8, line: 'Memory threw: ' + (e.message || 'error') });
  }

  let openIssues = 0, inProg = 0, panTagged = 0;
  try {
    if (hasLinear) {
      const r = await fetch('https://api.linear.app/graphql', {
        method: 'POST',
        headers: { Authorization: process.env.LINEAR_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `{ issues(filter: { state: { type: { nin: ["completed", "canceled"] } } }, first: 25) { nodes { title state { name type } } } }`
        })
      });
      linearOk = r.ok;
      if (r.ok) {
        const data = await r.json();
        const nodes = data.data?.issues?.nodes || [];
        openIssues = nodes.length;
        inProg = nodes.filter(n => /in progress|started/i.test(n.state?.name || '') || n.state?.type === 'started').length;
        panTagged = nodes.filter(n => /pan/i.test(n.title || '')).length;
        if (inProg >= 2) gossip.push({ risk: 9, line: `Nerves overcommitted — ${inProg} In Progress at once` });
        if (openIssues === 0) gossip.push({ risk: 3, line: 'Nerves quiet — no open issues (calm or forgotten?)' });
        else if (panTagged === 0) gossip.push({ risk: 2, line: `Nerves open (${openIssues}) but none titled Pan — attention may drift` });
        else gossip.push({ risk: 1, line: `Nerves holding ${openIssues} open (${panTagged} Pan-tagged, ${inProg} in progress)` });
      } else {
        gossip.push({ risk: 7, line: 'Linear configured but silent' });
      }
    } else {
      gossip.push({ risk: 5, line: 'Linear absent — no LINEAR_API_KEY' });
    }
  } catch (e) {
    gossip.push({ risk: 7, line: 'Linear threw: ' + (e.message || 'error') });
  }

  if (notionOk && linearOk && inProg >= 2) {
    gossip.push({ risk: 7, line: 'Memory is beating while Nerves juggle multiple In Progress — attention split' });
  }
  if (notionOk && !linearOk) {
    gossip.push({ risk: 6, line: 'Memory sings alone — Linear not in the chord' });
  }
  if (linearOk && !notionOk) {
    gossip.push({ risk: 6, line: 'Linear sings alone — Memory not in the chord' });
  }
  if (!hasCal) {
    gossip.push({ risk: 2, line: 'Time organ optional-absent — no ICS (calendar gossip is soft)' });
  }
  if (notionOk && linearOk && inProg <= 1 && openIssues > 0) {
    gossip.push({ risk: 1, line: 'Duet is clean — prefer Oracle on the highest Linear signal' });
  }

  gossip.sort((a, b) => b.risk - a.risk);
  const top = gossip[0];
  const move = top && top.risk >= 7
    ? 'Address top gossip only: ' + top.line
    : top && top.risk >= 4
      ? 'Watch: ' + top.line
      : !hasCal
        ? 'Light Time organ: set CALENDAR_ICS_URL on Vercel (Linear ADJ-12)'
        : 'Organs mostly aligned — one Oracle move on highest Linear signal';

  return res.status(200).json({
    being: 'Pan',
    layer: 'gossip',
    gossip: gossip.map(g => g.line),
    ranked: gossip,
    top: top || null,
    oneMove: move,
    live: { notion: notionOk, linear: linearOk, calendar: hasCal, openIssues, inProg, panTagged },
    at: new Date().toISOString(),
    version: '0.9.3-gossip'
  });
}
