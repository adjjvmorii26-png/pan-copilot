# Pan Triad HUD v0.9.10

MV3 overlay: Gossip · Forge · Time triad, bottleneck, oneMove.

## Install
1. Optional: `python3 local_mock_api.py` (:8787)
2. Chrome → Extensions → Developer mode → Load unpacked → this folder
3. Open localhost or allowed host

## Architecture
- **background.js** — all network, storage, alarms, triadInput
- **content.js** — DOM only (textContent), messages worker
- **pan-face.css** — DARK_HEX_CYBERNETIC palette

## Failover
local mock → Manus → api.alexalex.info → Vercel Pan edge
