// Pan – Context Synthesis API (Vercel Serverless Function style)
// Deploy this folder to Vercel or adapt for Netlify Functions.
//
// POST /api/synthesize
// Body: { query, pageTitle, pageUrl, focus? }
// Returns structured synthesis matching skills/context-synthesis.md

export default async function handler(req, res) {
  // CORS for the browser extension
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query = '', pageTitle = '', pageUrl = '', focus = ['memory', 'tasks', 'calendar'] } = req.body || {};

    // ---------- 1. Gather from organs ----------
    // TODO: Replace these stubs with real API calls using env vars:
    // NOTION_TOKEN, NOTION_DATABASE_ID, LINEAR_API_KEY, GOOGLE_*

    const memorySignals = await fetchMemoryPalace(query);
    const taskSignals = await fetchLinearIssues();
    const calendarSignals = await fetchCalendar();

    // ---------- 2. Filter & Synthesize ----------
    const signals = [
      ...memorySignals,
      ...taskSignals,
      ...calendarSignals,
      { source: 'Page', text: `Currently on: ${pageTitle || pageUrl || 'unknown'}` }
    ].filter(Boolean);

    const tensions = [];
    if (taskSignals.some(s => s.text.includes('Backlog') || s.text.includes('In Progress'))) {
      tensions.push('Open work exists in Linear that is not yet reflected in the live panel');
    }
    if (memorySignals.length === 0) {
      tensions.push('No recent Memory Palace entries retrieved (check token / database id)');
    }

    const recommendations = [
      '1. Verify NOTION_TOKEN and LINEAR_API_KEY are set in the deployment environment',
      '2. Once live data flows, replace the mock in the extension with this endpoint',
      '3. Add short-term caching in the background service worker'
    ];

    // ---------- 3. Return contract ----------
    const result = {
      status: `Pan synthesis for "${query || 'general status'}". ${signals.length} signals gathered.`,
      signals,
      tensions,
      recommendations,
      meta: {
        generatedAt: new Date().toISOString(),
        version: '0.3.0-scaffold',
        organsQueried: focus
      }
    };

    return res.status(200).json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: 'Synthesis failed',
      message: err.message,
      status: 'Pan could not complete synthesis. Check server logs.'
    });
  }
}

// ---------- Organ stubs (replace with real implementations) ----------

async function fetchMemoryPalace(query) {
  // Real implementation would use Notion API:
  // const notion = new Client({ auth: process.env.NOTION_TOKEN });
  // query the Pan Memory Palace database
  return [
    { source: 'Memory Palace', text: '[stub] Recent evolutions and birth log are present. Replace with live Notion query.' }
  ];
}

async function fetchLinearIssues() {
  // Real implementation:
  // fetch('https://api.linear.app/graphql', { headers: { Authorization: process.env.LINEAR_API_KEY }, ... })
  return [
    { source: 'Linear', text: '[stub] ADJ-7 In Progress, ADJ-8 In Progress (wiring). Replace with live Linear query.' }
  ];
}

async function fetchCalendar() {
  // Real implementation with Google Calendar API
  return [
    { source: 'Calendar', text: '[stub] Pan Awakening event exists. Replace with live Calendar query.' }
  ];
}
