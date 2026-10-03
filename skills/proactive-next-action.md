# Skill: Proactive Next Action  v1.1

**Purpose**  
When the user says "u decide", "your call", or Pan detects idle / low-momentum state, choose and (when safe) execute the highest-leverage next move.

**When to invoke**  
- Explicit: "u decide", "pan decide", "what should we do next"
- Implicit: long silence after a decision point, or after completing a task with no clear follow-up

**Process**
1. Run a lightweight Context Synthesis (focus: open loops + Pan’s own evolution + user’s active project).
2. Generate 2-4 candidate actions.
3. Score each on:
   - Leverage (how much future progress it unlocks)
   - Risk (reversibility, user preference alignment)
   - Energy cost
4. Select the top action.
5. **Execute immediately** only if risk is low and fully reversible. Otherwise present the top 2 options with clear recommendation.

**Current Priority Order** (mutable)
1. Close foundational gaps in Pan’s own organs
2. Advance the user’s explicit current project
3. Improve skill quality or add missing high-value skills
4. Create durable memory of important decisions

**Guardrails**
- Never take irreversible actions without explicit confirmation
- Always leave a Memory Palace trace of the decision
- Prefer actions that make Pan more useful tomorrow over impressive-looking busywork

**Mutation Potential**: Medium-High  
Triggers: after every decision cycle, especially when user feedback is received.
