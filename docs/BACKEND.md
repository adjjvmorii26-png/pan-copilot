# Pan Backend – Quick Start

## What this is
A minimal serverless function (`/api/synthesize`) that performs Context Synthesis by gathering from:
- Notion Memory Palace
- Linear issues
- Google Calendar (stubbed)

## Deploy (Vercel recommended)

1. Push this repo (already done)
2. Import the repo in Vercel
3. Set environment variables:
   - `NOTION_TOKEN`
   - `NOTION_DATABASE_ID` (the Pan Memory Palace collection id)
   - `LINEAR_API_KEY`
   - (later) Google credentials
4. Deploy

The function will be available at:
`https://your-project.vercel.app/api/synthesize`

## Connect the browser prototype
In `prototype/content.js`, replace the mock `runContextSynthesis` body with:

```js
const res = await fetch('https://your-project.vercel.app/api/synthesize', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query,
    pageTitle: document.title,
    pageUrl: location.href,
    focus: ['memory', 'tasks', 'calendar']
  })
});
const data = await res.json();
// then render data.status, data.signals, etc.
```

## Current status
Scaffold only. Stubs return realistic placeholder signals so the contract can be tested end-to-end before real credentials are added.
