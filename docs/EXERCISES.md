# Pan Exercises

Short, measurable workouts. Run with panel + curl. Log outcomes in Memory Palace.

---

## Exercise A — Chord Stress (10 min)

**Goal:** Force activity triad through imbalance → resonance pulse → recovery.

### Protocol
1. **Baseline** (1 min)  
   ```bash
   curl -s https://pan-copilot-ixpansion-agents.vercel.app/api/synapse | jq '{chord,coherence,phrase}'
   curl -s https://pan-copilot-ixpansion-agents.vercel.app/api/heartbeat | jq '{chord,organs,pulse}'
   ```
   Record organ chord + coherence.

2. **Induce friction** (2 min)  
   Post skewed metrics (Forge starved):
   ```bash
   curl -s -X POST https://pan-copilot-ixpansion-agents.vercel.app/api/edge \
     -H 'Content-Type: application/json' \
     -d '{
       "agent_id": "exercise_a",
       "cognitive_state": "Chaotic",
       "delta_hours": 1,
       "organ_metrics": { "gossip": 0.92, "forge": 0.15, "time": 0.88 }
     }' | jq '{triad, resonance}'
   ```
   Expect: high friction, pulse action `feed` on **Forge**.

3. **Correct** (3 min)  
   - Panel: **✨ Forge** twice (seal + token)  
   - Or:
   ```bash
   curl -s -X POST https://pan-copilot-ixpansion-agents.vercel.app/api/forge \
     -H 'Content-Type: application/json' \
     -d '{"kind":"seal","seed":"exercise-a"}' | jq '{name,organs}'
   ```

4. **Re-measure** (2 min)  
   ```bash
   curl -s -X POST https://pan-copilot-ixpansion-agents.vercel.app/api/edge \
     -H 'Content-Type: application/json' \
     -d '{
       "cognitive_state": "Resonant",
       "delta_hours": 0,
       "organ_metrics": { "gossip": 0.85, "forge": 0.8, "time": 0.9 }
     }' | jq '.resonance.pulse'
   ```
   Expect: lower friction, pulse `mint` or soft `nudge`.

5. **HUD** (2 min)  
   Panel **△ Triad** — chips should show activity chord + bn shift.

### Pass criteria
| Check | Pass |
|-------|------|
| Skewed edge returns `feed`/`Forge` or high friction | ✓ |
| After forge, friction drops or pulse softens | ✓ |
| Panel triad HUD updates | ✓ |

---

## Exercise B — Trophic Forge (12 min)

**Goal:** Match task load to cognitive bandwidth (Energy Flow Scheduler) then leave an asset.

### Protocol
1. **Pick mood** — honest self-report or edge state: `strong` | `thin` | `quiescent`

2. **Schedule** (run locally or mental):
   ```js
   // experiments/energy-flow-scheduler/scheduler.js logic
   // strong → apex task; thin → base task; quiescent → dormant/recovery
   ```
   Tasks:
   - Apex: write one Oracle one-liner from Gossip  
   - Mid: triage one Linear glance / Gossip read  
   - Base: **✨ Forge** a myth or token only  
   - Dormant: no new load — hold

3. **Execute only the scheduled layer** (5–8 min)

4. **Seal** — if not dormant, mint via Forge with seed `trophic-YYYYMMDD`

5. **Trace** — optional Notion Evolution: *Exercise B · mood · layer · asset name*

### Pass criteria
| Check | Pass |
|-------|------|
| Did only the layer-appropriate action | ✓ |
| No apex work under thin/quiescent | ✓ |
| Asset or explicit recovery hold logged | ✓ |

---

## Optional C — Omnis Swarm smoke (5 min)

```bash
npx serve experiments/omnis-swarm
```
Watch `food known` rise as scouts gossip. Pass if known count increases without UI freeze.

---

*Exercises decided 2026-10-10 — Chord Stress + Trophic Forge.*
