# Skill: Energy Flow Scheduler (Trophic Energy)  v0.1

**Purpose**  
Schedule work by **cognitive bandwidth**, not only clock slots. Trophic layers: deep focus · collaborative · recovery · administrative.

**When**  
Overloaded calendar · empty calendar with mental fog · choosing next Pan alone-mode task · pairing with Time organ ICS

**Trophic layers**
| Layer | Bandwidth | Examples |
|-------|-----------|----------|
| Apex | High, uninterrupted | Architecture, hard coding, Oracle moves |
| Mid | Medium, interruptible | Reviews, Linear triage, Gossip |
| Base | Low, restorative | Docs, Forge play, skill compost |
| Dormant | Recovery | No new tasks; Quiescent is valid |

**Process**
1. Score open tasks: `focus_cost` 0–1, `deadline_pressure` 0–1, `energy_fit` vs current state
2. Read current cognitive state (panel mood / edge gem / self-report)
3. Rank: prefer tasks where `energy_fit ≥ focus_cost` and pressure is honest
4. Output **one next action** + layer + why (bottleneck only)

**Output contract**
```json
{
  "next": { "title": "...", "layer": "apex|mid|base|dormant", "why": "..." },
  "deferred": ["..."],
  "bandwidth": 0.0
}
```

**Why Pan**  
Time organ without energy is rigid slots. Distributed consciousness includes **human/agent energy** as a live signal.

**Code**  
`experiments/energy-flow-scheduler/scheduler.js`

**Mutation potential**: High
