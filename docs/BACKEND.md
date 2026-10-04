# Pan Backend (Netlify Function)

## Endpoint
```
POST https://pan-copilot-ajlp.netlify.app/.netlify/functions/synthesize
```

## What it does
Gathers live context from:
- Notion Memory Palace (Active + High priority)
- Linear (open issues in Pan project) — when LINEAR_API_KEY is set
- Current page title (always)

and returns the structured Context Synthesis format.

## Environment variables on the Netlify site
| Variable | Status |
|----------|--------|
| `NOTION_TOKEN` | Set |
| `NOTION_DATABASE_ID` | Set |
| `LINEAR_API_KEY` | Optional — add when ready |

## Deploy
The function lives at `netlify/functions/synthesize.js`.
`netlify.toml` publishes `public/` and registers the functions folder.

Link the GitHub repo `adjjvmorii26-png/pan-copilot` to the Netlify site (if not already) so every push deploys both the status page and the function.

## Prototype
`prototype/content.js` (v0.5) is already pointed at the live endpoint.
Reload the unpacked extension after the function is deployed.
