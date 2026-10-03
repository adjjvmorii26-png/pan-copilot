# Pan Backend (Netlify)

## Live site
- Project: https://app.netlify.com/projects/pan-copilot
- Primary URL: https://pan-copilot.netlify.app
- Function endpoint (once deployed): https://pan-copilot.netlify.app/api/synthesize

## What I already did for you
1. Created the Netlify site `pan-copilot`
2. Wrote the function in modern Netlify format (`netlify/functions/synthesize.js`)
3. Added `netlify.toml` + redirect so `/api/synthesize` works
4. Real Notion + Linear clients with graceful stubs

## What still needs a human (secrets)
I cannot see or set your private tokens. You only need to do this once:

1. Open https://app.netlify.com/projects/pan-copilot
2. Site configuration → Environment variables
3. Add:
   - `NOTION_TOKEN`
   - `NOTION_DATABASE_ID`
   - `LINEAR_API_KEY`
4. Trigger a deploy (or connect the GitHub repo so every push deploys)

## Connect the extension
In `prototype/content.js` set:

```js
const PAN_API_URL = 'https://pan-copilot.netlify.app/api/synthesize';
```

Reload the extension → click 🧠.

## Notion / Linear reminders
- Notion: create an internal integration, share the Memory Palace database with it, copy the database ID.
- Linear: Settings → API → Personal API key.
