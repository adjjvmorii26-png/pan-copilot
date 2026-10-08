# Pan Proof Battery

**Latest deep audit:** 2026-10-08 — see [AUDIT-2026-10-08.md](./AUDIT-2026-10-08.md)

| # | Test | Result |
|---|------|--------|
| 01 | Heartbeat | PASS · strong (align to 0.9.1 on next deploy) |
| 02 | Synapse | PASS · duet · coh≥80 |
| 03 | Synthesize | PASS · v0.9.0-synapse · live N+L |
| 04 | Genome files | PASS |
| 05 | Panel 0.9.1 | PASS · avatar + moods |
| 06 | Legendarium | PASS |
| 07 | Skill catalog | PASS · 28 files audited |
| 08 | LLM bridge | PASS · 503 without LLM_BASE_URL expected |
| 09 | Status page | PASS · HTTP 200 |
| 10 | Netlify synthesize | **LAG** · v0.5.x — Vercel primary |

## Endpoints
- https://pan-copilot-ixpansion-agents.vercel.app/api/heartbeat
- https://pan-copilot-ixpansion-agents.vercel.app/api/synapse
- https://pan-copilot-ixpansion-agents.vercel.app/api/synthesize
- https://pan-copilot-ajlp.netlify.app/
