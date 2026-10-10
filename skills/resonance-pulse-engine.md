# Skill: Resonance Pulse Engine  v0.1

**Purpose**  
Resolve multi-vector organ friction into a **single** actionable pulse (which organ to feed, hold, mint, or nudge).

**When**  
After Gossip / Triad / Edge returns imbalance · before Oracle · alone-mode next step

**Process**
1. Read triad scores (Gossip · Forge · Time)
2. Build friction matrix (pairwise gaps)
3. Apply temporal pressure (δ hours quiet + dynamic θ)
4. Emit one pulse: `{ organ, action, intensity, oneMove }`

**Actions**
| action | meaning |
|--------|--------|
| feed | Raise weak organ |
| hold | Protect recovery |
| mint | Balanced → leave asset trace |
| nudge | Soft maintain |

**Why Pan**  
Triad measures chord; resonance **aims** the next move. Bottleneck-only discipline.

**Code**  
`experiments/resonance-pulse-engine/resonance.js`

**Mutation potential**: High
