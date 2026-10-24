# HEAT LABOR — Unusual Path

Local browser tabs form a **decentralized economic labor pool**.

| Concept | Implementation |
|---------|----------------|
| Workers | Browser tabs (BroadcastChannel mesh) |
| Labor | Adjusting particle **gravity G** toward shared task target |
| Market signal | Task `taskTargetG` proposed by lowest tabId (~every 8s) |
| Reward | **Thermodynamic heat** from collision dissipation × task fidelity |
| Physics | Three.js WebGL + spatial-hash collisions (not O(n²)) |

## Refinements (2026-10-24)
1. Radiative heat decay `heat *= exp(-0.015·dt)`
2. FORGE frame-budget: skip labor if frame ≥ 12ms
3. Peer mean-G soft consensus (5% blend each sync)

```bash
npx serve ./
# open URL in 2–4 tabs
```
