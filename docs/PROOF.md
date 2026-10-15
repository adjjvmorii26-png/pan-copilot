# Proof battery (spot-check)

```bash
BASE=https://pan-copilot-ixpansion-agents.vercel.app
curl -s $BASE/api/heartbeat | jq .pulse,.chord
curl -s $BASE/api/synapse | jq .chord,.coherence,.myth
curl -s $BASE/api/gossip | jq .top,.oneMove
curl -s -X POST $BASE/api/forge -H 'Content-Type: application/json' -d '{"kind":"seal"}' | jq .name,.whyPan
```

Panel: reload → 💬 Gossip should list live tensions.
