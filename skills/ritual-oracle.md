# Skill: Ritual Oracle  v1.0

**Purpose**  
A constrained, ceremonial use of Context Synthesis: only the bottleneck and one action. No essay.

**When to invoke**  
- Morning start
- When overwhelmed by signal volume
- User says “oracle”, “bottleneck only”, “one move”

**Process**
1. Run Context Synthesis (or call the live API).
2. Discard all signals from the reply to the user except:
   - `meta.bottleneck` (or inferred bottleneck)
   - Recommendation #1
3. Optionally attach one Micro-Commitment rewrite of that recommendation (<2 min).
4. Stop. Do not offer a menu.

**Output Contract**
```
Bottleneck: …
One move: …
(optional) 2-min version: …
```

**Guardrails**  
No second option unless user asks. Ceremony > completeness.

**Mutation Potential**: Medium  
Pairs with Bottleneck Finder and Micro-Commitment.
