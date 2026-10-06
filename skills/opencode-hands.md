# Skill: OpenCode Hands  v1.0

**Purpose**  
Use **OpenCode** (open-source coding agent) as Pan’s hands on the **genome** while Pan keeps Memory Palace + Linear.

**Install**
```bash
curl -fsSL https://opencode.ai/install | bash
# or: npm i -g opencode-ai
```

**When to invoke**
- Multi-file genome edits
- Refactors, tests, skill file bulk updates
- User says “opencode”, “hands on repo”

**Process**
1. `cd` into `pan-copilot`.
2. Run OpenCode with Ollama or preferred provider.
3. Constrain: respect `AGENT.md` dual-mode rules; leave Evolution traces in Notion after big changes.
4. Prefer small PRs / commits with clear messages.

**Pairing**
| Pan | OpenCode |
|-----|----------|
| Oracle / Shadow / Memory | Edit files, run commands |
| Linear issues | Implement issues |
| Asset Alchemist design | Code the asset into prototype/ |

**Guardrails**
- No force-push to main without human.
- Don’t invent organ credentials in code.
