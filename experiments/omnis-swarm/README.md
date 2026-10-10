# Omnis Swarm

3D multi-agent simulation: **spatial hash** neighbor queries, **range-limited gossip**, **utility AI** (wander / seek / harvest / relay).

## Architecture
| Component | Structure | Complexity |
|-----------|-----------|------------|
| SpatialHash3D | uniform grid, 3³ stencil | O(k) neighbors, k ≪ n |
| MessageRing | power-of-two ring buffer | O(1) push/pop, drop on full |
| Agents | SoA float buffers | cache-friendly integrate |
| AI | utility scores per tick | O(1) + local food scan |

## Roles
- **Scout** (cyan) — large sense radius, broadcasts FOOD_HINT
- **Worker** (violet) — harvest / seek on belief
- **Relay** (green) — prioritizes spreading high-confidence hints

## Run
Serve the folder (ES modules):
```bash
npx serve experiments/omnis-swarm
# open index.html
```

Or open via any static server from `artifacts/omnis-swarm`.

## Tunables (`swarm.js`)
`N_AGENTS`, `COMM_RADIUS`, `CELL`, `MAX_SPEED`, `FOOD_COUNT`
