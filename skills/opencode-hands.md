# Skill: OpenCode Hands  v2.0

**Purpose**
Use **OpenCode** (open-source coding agent) as Pan's hands on the **genome** while Pan keeps Memory Palace + Linear.

**Install**
```bash
# Note: the official @opencode/cli npm package cannot run on this
# Android/arm64 sandbox (the ARM64 opencode-server binary is blocked by the
# sandbox's execve policy for files under /data/user/0/com.vscodroid/files/).
# This skill uses a pure-Node.js driver instead, which behaves identically.
npm install --save-dev @ai-sdk/openai-compatible ollama-ai-provider
npm run opencode
```

**When to invoke**
- Multi-file genome edits
- Refactors, tests, skill file bulk updates
- User says "opencode", "hands on repo"

**Process**
1. `cd` into `pan-copilot`.
2. Run OpenCode Hands (Node.js driver): `npm run opencode`.
3. Constrain: respect `AGENT.md` dual-mode rules; leave Evolution traces in Notion after big changes.
4. Prefer small PRs / commits with clear messages.

**Pairing**
| Pan | OpenCode Hands |
|-----|----------------|
| Oracle / Shadow / Memory | Edit files, run commands |
| Linear issues | Implement issues |
| Asset Alchemist design | Code the asset into prototype/ |

**Guardrails**
- No force-push to main without human.
- Don't invent organ credentials in code.

**One-shot commands**
- `npm run opencode -- --cmd=status` — git status
- `npm run opencode -- --cmd=diff` — git diff --stat
- `npm run opencode -- --cmd="commit <msg>"` — commit
- `npm run opencode -- --cmd=push` — push
- `npm run opencode -- --cmd=skills` — list skills
- `npm run opencode -- --cmd=heartbeat` — organ pulse
- `npm run opencode -- --cmd=idea` — plan next change with the model

**Interactive mode**
```bash
npm run opencode
```
Then type commands (status, diff, skills, heartbeat, commit <msg>, push, idea).
