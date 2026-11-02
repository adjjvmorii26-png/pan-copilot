# Pan STATUS — 2026-11-01

## Live
- Edge: `https://pan-copilot-ixpansion-agents.vercel.app/api/edge` · **0.9.7-edge**
- HUD extension: **v0.9.12** (Vercel primary; alexalex.info retired)
- Live chamber: edge_catalog, edge_post, openclaw, vsa, bridge — **5/5 PASS** (Redis soft-fail → WAL)

## Branches
| Branch | Role |
|--------|------|
| **main** | Canonical genome (api, docs, extension, experiments) |
| **master** | Historical default — README now points to main |

**Action (human):** Settings → Branches → default = **main**.

## Failover order (HUD)
1. local `:8787`
2. Vercel edge
3. Manus
4. final → Vercel

## Gaps
- Redis Path A offline
- Edge 0.9.7 vs HUD 0.9.12 version skew
- `/api/health` may 404; use `/api/heartbeat` / edge GET
- Phase V scale unproven; Phase VI gated

## Steward
Deep genome scan + live chamber completed 2026-11-01.
