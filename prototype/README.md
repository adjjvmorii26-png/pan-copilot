# Pan Browser Prototype (v0.9.1)

Floating real-time panel on any page — with the living avatar in its header.

## Load
1. `chrome://extensions` → Developer mode
2. Load unpacked → this `prototype` folder
3. Reload extension after pulls
4. Open any page → the avatar sits **left of "Pan"** in the panel header

## Avatar DNA
**Sigil × Constellation × Heartbeat × Dual-mode** — a face made of organs, not a
chatbot bubble:

| Strand | In the face |
|--------|-------------|
| Sigil | void disk + breathing ring (`docs/legacy/sigil-pan.svg`) |
| Constellation | 6 organ stars linked by 3 path chords |
| Heartbeat | pulsing core, `pan-breathe` ring, moods driven by `GET /api/heartbeat` |
| Dual-mode | two counter-rotating orbits (With Grok / Alone) |

Moods: idle · strong · thin · oracle · shadow · synapse → `docs/legacy/pan-avatar.md`

## Proof (offline)
```bash
node prototype/verify.mjs
```
Checks syntax, manifest wiring, avatar-left-of-Pan order, all four DNA strands,
mood/CSS parity, and the HTML escaper.

## Buttons
| Control | Action |
|---------|--------|
| 🧠 Synth | Full multi-organ briefing |
| 🔮 Oracle | Bottleneck + one move only |
| 📄 Page | Current tab / selection |
| 🎙️ | Speech input (if available) |

## Backend
Primary: `https://pan-copilot-ixpansion-agents.vercel.app/api/synthesize`  
API v0.8 · Notion + Linear live · Calendar via ICS optional

## Organs
- Memory Palace ✅
- Linear ✅
- Calendar ⏳ set `CALENDAR_ICS_URL` for auto agenda
