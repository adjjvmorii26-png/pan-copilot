# Pan Skills

Living skill definitions that Pan loads, executes, and mutates.

Skills follow a lightweight, evolvable format inspired by the experimental skill family (dna-mutator, lattice-genome, resonance-lab, etc.).

## Active Skills

| Skill | Purpose | Maturity |
|-------|---------|----------|
| [Context Synthesis](./context-synthesis.md) | Multi-organ awareness → coherent briefing | v1.1 |
| [Proactive Next Action](./proactive-next-action.md) | Decide & act when user says "u decide" or idle | v1.1 |
| [Memory Crystallizer](./memory-crystallizer.md) | What is worth writing into the Memory Palace | v1.0 |
| [Skill Mutator](./skill-mutator.md) | Meta-skill: refine or evolve other skills | v1.0 |

## Evolution Protocol
1. Any skill can propose a mutation after use.
2. High-value mutations are committed here with a clear commit message.
3. Every skill evolution is also logged as an "Evolution" entry in the Notion Memory Palace.
4. Prefer small, high-signal upgrades over large rewrites.

## Format Convention
Every skill file contains:
- Purpose
- When to invoke
- Process (clear steps)
- Output contract
- Failure modes / guardrails
- Mutation potential + triggers
