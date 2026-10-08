# Pan Proof Battery

**Run:** 2026-10-06T15:21Z (approx)  
**Result:** **10 / 10 PASS**

| # | Test | Result | Evidence |
|---|------|--------|----------|
| 01 | `GET /api/heartbeat` | PASS | pulse=strong · notion+linear beating |
| 02 | `POST /api/synthesize` | PASS | live.notion=true · live.linear=true · bn=null · 9 signals |
| 03 | Notion Memory Palace query | PASS | Active sample returned |
| 04 | Genome `AGENT.md` raw | PASS | HTTP 200 |
| 05 | `docs/legacy/LEGENDARIUM.md` | PASS | Legendary index live |
| 06 | Skill builders + compost + alchemist | PASS | raw.githubusercontent 200 |
| 07 | Netlify status page | PASS | HTTP 200 |
| 08 | `prototype/manifest.json` | PASS | Panel packaged |
| 09 | `POST /api/llm-bridge` | PASS | HTTP 503 expected without LLM_BASE_URL |
| 10 | Charter · Dual-mode · LLM-ORGANS | PASS | Docs present |

## Endpoints
- Heartbeat: https://pan-copilot-ixpansion-agents.vercel.app/api/heartbeat
- Synthesize: https://pan-copilot-ixpansion-agents.vercel.app/api/synthesize
- Status: https://pan-copilot-ajlp.netlify.app/
- Genome: https://github.com/adjjvmorii26-png/pan-copilot

## Re-run
```bash
curl -s https://pan-copilot-ixpansion-agents.vercel.app/api/heartbeat | jq .
curl -s -X POST https://pan-copilot-ixpansion-agents.vercel.app/api/synthesize \
  -H 'Content-Type: application/json' -d '{"query":"proof"}' | jq .meta
```
