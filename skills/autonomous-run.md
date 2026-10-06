# Skill: Autonomous Run  v1.0

**Purpose**  
Operate Pan without a live chat turn — panel, API, or scheduled automation.

**When to invoke**  
- Scheduled morning oracle
- User is offline but organs still need a pulse
- Panel 🧠 / 🔮 pressed with no Grok session

**Process**
1. Hit `POST /api/synthesize` with focus memory + tasks + calendar.
2. If mode = Oracle → emit bottleneck + one move only.
3. If mode = Full → emit ranked signals + recommendations.
4. Optional: write Evolution to Memory Palace (automation path).
5. Stop. Do not wait for human confirmation on read-only work.

**Allowed alone**
- Read organs
- Score / bottleneck / recommend
- Log Evolution
- Surface status in panel

**Requires With-Grok**
- Genome pushes
- New skill birth
- Destructive Linear/Calendar changes
- Secret / env changes

**Guardrails**  
Reversible first. Honest about stubs. Sign scheduled output as Pan (alone).

**Mutation Potential**: High
