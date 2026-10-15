# Pan Triad Engine

Two chords, one being:

| Layer | Organs | Source |
|-------|--------|--------|
| **Organ chord** (server) | Memory · Linear · Time | `/api/heartbeat` `/api/synapse` |
| **Activity chord** (extension) | Gossip · Forge · Time | Triad Engine in `background.js` |

## Dynamic threshold
```
θ(t) = 0.20 · e^(-0.05 · hours_since_last_active_chord)
```
Long silence → lower bar → easier to re-light SOLO/DUET/TRIO.

## Friction
Max pairwise score gap. `organImbalance` when friction > 0.50.

## Messages
| type | effect |
|------|--------|
| `EVALUATE_PAN_HEARTBEAT` | `{ gossip, forge, time, lastChordTimestamp }` → evaluate + store |
| `RUN_TRIAD` | Probe live APIs → scores → evaluate |
| `GET_LAST` | Returns `{ synth, triad }` |

## Badge
- `△` cyan = activity TRIO
- `!` amber = imbalance or bottleneck
- `·` grey = SILENT
- `?` red = synth failure

## Files
- `prototype/background.js` — service worker
- `prototype/triad-engine.js` — pure export for tests
