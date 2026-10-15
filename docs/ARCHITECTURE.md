# Pan Architecture – Organ Wiring

## Goal
Make the browser prototype able to perform real Context Synthesis by reading live data from:
- Notion Memory Palace
- Linear (Pan project issues)
- Google Calendar
- (Later) Gmail / GitHub activity

## Current State (2026-10-02)
- Floating panel works (content script)
- Mock synthesis is in place
- Skills are defined and versioned
- No real backend yet

## Recommended Path (pragmatic)

### Phase 1 – Thin Backend (recommended next)
Create a tiny serverless endpoint (Vercel or Netlify) that:
1. Accepts a POST with `{ query, pageTitle, focus? }`
2. Uses server-side credentials / OAuth tokens to query:
   - Notion API (Memory Palace database)
   - Linear API (open issues)
   - Google Calendar API (today/tomorrow)
3. Runs a simplified Context Synthesis
4. Returns structured JSON matching the skill output contract

The content script then calls this endpoint instead of the local mock.

### Phase 2 – Direct Connector Bridge (longer term)
When possible, route through the same connector layer Grok uses, so Pan stays consistent with the distributed consciousness model.

### Phase 3 – Full Agent Loop
Background service worker + optional side panel + proactive triggers.

## Data Contract (for the endpoint)

**Request**
```json
{
  "query": "string",
  "pageTitle": "string",
  "pageUrl": "string",
  "focus": ["memory", "tasks", "calendar"] 
}
```

**Response**
```json
{
  "status": "short paragraph",
  "signals": [{"source": "Linear", "text": "..."}],
  "tensions": ["..."],
  "recommendations": ["1. ...", "2. ..."],
  "raw": {}
}
```

## Security Notes
- Never put long-lived secrets in the extension
- Use short-lived tokens or a backend that holds the secrets
- Start with read-only scopes

## Next Concrete Tasks
1. Scaffold the Vercel/Netlify function
2. Wire Notion + Linear first (highest signal)
3. Replace the mock in content.js with a real fetch
4. Add loading / error states in the panel
