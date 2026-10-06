# Skill: Pattern Sense  v1.0

**Purpose**  
Detect recurring patterns across sessions, issues, and Memory Palace entries — the “intelligence” layer above single-shot synthesis.

**When to invoke**  
- After several related Evolutions
- When the same tension appears twice (e.g. env vars, permissions)
- User asks “what keeps happening?” or “what’s the pattern?”

**Process**
1. Scan recent Linear issues + Memory Palace Evolutions/Insights.
2. Cluster by theme (credentials, deploy, skill growth, UI).
3. Name the pattern in one sentence.
4. Propose a structural fix (not just the next instance).

**Output Contract**
- Pattern name
- Evidence (2–4 bullets)
- Structural recommendation

**Example patterns**
- “Permission gate”: integration share / API key missing
- “Deploy lag”: env change without redeploy
- “Skill sprawl”: new skills without pruning

**Guardrails**  
Need ≥2 data points. Don’t overfit noise.

**Mutation Potential**: High
