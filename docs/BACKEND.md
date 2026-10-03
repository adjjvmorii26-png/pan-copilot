# Pan Backend – Deploy & Connect

## What it does
`POST /api/synthesize` gathers live context from:
- Notion Memory Palace (Active + High priority entries)
- Linear (open issues in any project whose name contains "Pan")
- Current page title (always)

and returns the structured format expected by the Context Synthesis skill and the browser panel.

## Required Environment Variables

| Variable              | Description                                      |
|-----------------------|--------------------------------------------------|
| `NOTION_TOKEN`        | Notion internal integration token                |
| `NOTION_DATABASE_ID`  | ID of the "Pan Memory Palace" database           |
| `LINEAR_API_KEY`      | Linear personal API key                          |

If any are missing the function still works but returns clearly marked stubs.

## Deploy on Vercel (fastest)

1. Go to vercel.com → Add New Project
2. Import `adjjvmorii26-png/pan-copilot`
3. Framework preset: Other (or leave default)
4. Add the three environment variables above
5. Deploy

Your endpoint will be:
`https://<project-name>.vercel.app/api/synthesize`

## Connect the browser extension

Open `prototype/content.js` and set:

```js
const PAN_API_URL = 'https://<project-name>.vercel.app/api/synthesize';
```

Reload the extension. Click 🧠. You should now see live Memory Palace + Linear signals.

## Notion setup reminder
- Create an internal integration at https://www.notion.so/my-integrations
- Share the Pan Memory Palace database with that integration
- Copy the database ID (from the URL or the collection id)

## Linear setup reminder
- Settings → API → Personal API keys → Create key
- Paste as `LINEAR_API_KEY`

## Current version
0.4.0 – real client code with graceful fallbacks.
