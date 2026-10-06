# Pan Browser Prototype (v0.6)

Floating real-time panel that injects into any webpage, pinned to the
**bottom-right** corner.

## Load it

1. Chrome/Edge → `chrome://extensions`
2. Developer mode **ON**
3. **Load unpacked** → select this `prototype` folder
4. Open any website — the Pan panel should appear (bottom-right)

After editing files: click ⟳ on the extension card, then refresh the page. A
tab that was already open keeps its panel and will not re-inject.

## What's in the panel

- **🧠 Synth** — live multi-organ briefing from the backend
- **📄 Page** — current tab title, URL, and any selected text
- **?** — shortcuts
- Drag the header to move it · **–** minimizes · **×** hides (returns on the
  next page load)
- **🎙️** voice input where `SpeechRecognition` is available; Enter sends

## Backends

`content.js` tries them in order, then reports the last failure inline:

1. `https://pan-copilot-ixpansion-agents.vercel.app/api/synthesize` (primary)
2. `https://pan-copilot.vercel.app/api/synthesize`
3. `https://pan-copilot-ajlp.netlify.app/.netlify/functions/synthesize` (fallback)

All three answer with `Access-Control-Allow-Origin: *`, and the manifest's
`host_permissions` cover `*.vercel.app`, `*.netlify.app`, and `localhost`, so
the panel can call them from any origin. A failed synthesis never blocks the
page.

## Behavior notes

- Content scripts do not run on `chrome://`, the Web Store, or other extension
  pages; every normal site gets the panel.
- `window.panInjected` guarantees exactly one panel per page load.
- `background.js` is the service-worker stub for future message passing,
  caching, and proactive checks; the panel calls the backends directly today.
- The manifest version is `0.6.0`, matching the `v0.6` badge in the panel
  header and the `v0.6` banner the panel greets you with.

## Next

See `/docs/ARCHITECTURE.md` for the plan to connect Memory Palace + Linear +
Calendar. The fetch path in `content.js` is already the real one — the URL
list at the top of the file is the only place a backend swap has to touch.
