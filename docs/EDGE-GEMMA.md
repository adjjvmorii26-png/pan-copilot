# Edge organ — Local Gemma + `/api/edge`

## Live API
```bash
# Discover
curl -s https://pan-copilot-ixpansion-agents.vercel.app/api/edge | jq .

# Ingest gem state (from phone or simulator)
curl -s -X POST https://pan-copilot-ixpansion-agents.vercel.app/api/edge \
  -H 'Content-Type: application/json' \
  -d '{"agent_id":"mobile_node_01","cognitive_state":"Resonant","tilt":{"beta":12,"gamma":-3}}' | jq .
```

## Mood map
| Gemma word | Panel mood | Forge hint |
|------------|------------|------------|
| Resonant / Calm / Aligned | strong | token / seal |
| Chaotic / Turbulent | synapse | myth |
| Dormant / Quiet / Seeking | thin | token optional |
| Shadow | shadow | seal |
| Oracle | oracle | myth |
| Unknown | synapse | myth |

## Stack
Android LiteRT-LM → RN bridge → **POST /api/edge** → panel mood · optional `/api/forge`

Socket `telemetry_sync` remains optional; Pan core uses HTTP edge ingest so alone-mode works without `api.alexalex.info`.

## Charter
Phone is an organ. One-word states. Prefer assets when state flips.
