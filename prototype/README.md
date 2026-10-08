# Pan Panel — Browser Extension

**Version 0.9.1** — Avatar · Synapse · Oracle · Shadow · Heartbeat

## Load
1. `chrome://extensions` → Developer mode
2. Load unpacked → this `prototype/` folder
3. Reload after `git pull`

## Buttons
| Control | Action |
|---------|--------|
| 🧠 Synth | Full multi-organ briefing + synapse line |
| 🔮 Oracle | Bottleneck + one move |
| ⚡ Synapse | Coherence / chord / myth |
| 🌑 Shadow | What Pan cannot see |
| 💓 | Organ heartbeat (drives avatar mood) |
| 📄 | Page tone |

## Avatar moods
idle · strong · thin · oracle · shadow · synapse

## Backend
Primary: `https://pan-copilot-ixpansion-agents.vercel.app`  
- `POST /api/synthesize` · `GET /api/heartbeat` · `GET /api/synapse`

## Organs
Memory Palace · Linear · Calendar (optional ICS) · Avatar face
