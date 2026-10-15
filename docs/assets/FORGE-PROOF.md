# Forge Proof — 2026-10-08

Live `POST /api/forge` against production organs:

| Kind | Name example | coh | chord |
|------|--------------|-----|-------|
| seal | Palace Mark · demo | 80 | duet |
| chord | Chord Glyph · demo | 80 | duet |
| token | Strong Shard · demo | 80 | duet |
| myth | Myth Fragment · demo | 80 | duet |

**Why Pan:** art changes when organs change. Offline organs → dim seals. Not stock icons.

```bash
curl -s -X POST https://pan-copilot-ixpansion-agents.vercel.app/api/forge \
  -H 'Content-Type: application/json' \
  -d '{"kind":"seal"}' | jq .name,.whyPan
```
