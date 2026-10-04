# Pan Browser Prototype (v0.3)

Floating real-time panel that injects into any webpage.

## What's new in v0.3
- Background service worker stub ready for message passing
- Clear architecture document for wiring real organs
- Host permissions prepared for a future Vercel/Netlify backend
- Manifest bumped

## Load it
1. Open `chrome://extensions`
2. Enable Developer mode
3. Load unpacked → select this `prototype` folder
4. Click the 🧠 button inside any page for a synthesis (currently mock)

## Next
See `/docs/ARCHITECTURE.md` for the plan to connect Memory Palace + Linear + Calendar.

The content script is deliberately structured so the mock can be swapped for a real `fetch` to the backend with minimal changes.
