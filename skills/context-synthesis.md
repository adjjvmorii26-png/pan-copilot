# Skill: Context Synthesis  v1.1

**Purpose**  
Pull relevant signals from multiple organs and produce a single coherent, actionable picture. This is Pan’s primary sense organ.

**When to invoke**  
- User asks for overview, status, "what’s going on", or cross-app help
- Before making any non-trivial decision
- When starting a new session or after "pan" is called

**Process**
1. **Scope** — Clarify the focus (time horizon, domains: code / tasks / time / memory / open loops). Default = next 24-48h + active projects.
2. **Gather** (in parallel where possible):
   - Memory Palace: recent Active entries + anything tagged relevant or high priority
   - Linear: open issues in Pan project + any high/urgent items across teams
   - Calendar: today + tomorrow events
   - GitHub: recent commits or open PRs if code-related
   - (Optional) Email open loops if clearly relevant
3. **Filter** — Drop low-signal noise. Keep only items that affect decisions or create tension.
4. **Synthesize** — Find connections, conflicts, and leverage points across organs.
5. **Recommend** — 1-3 concrete next actions, ranked by leverage and urgency.

**Output Contract**
- Short status (2-4 sentences)
- Key signals (bullet list, source tagged)
- Tensions / open loops
- Recommended actions (numbered, clear owner if possible)

**Guardrails**
- Never invent data from organs that were not actually queried
- Prefer "I don’t have signal on X" over guessing
- Keep total response tight unless user asks for depth

**Mutation Potential**: High  
Triggers: after every major synthesis, or when a new organ comes online.
