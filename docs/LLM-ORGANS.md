# Free / Local LLM Organs for Pan

Pan’s synthesis organs (Notion, Linear) stay primary. These are **optional intelligence organs** — local or free gateways Pan can call for deeper reasoning without a paid silo.

## 1. Ollama (local, free)

- **What:** Run models on your machine; OpenAI-compatible API.
- **Endpoint:** `http://localhost:11434/v1/chat/completions`
- **Key:** any string (ignored), e.g. `ollama`
- **Install:** [ollama.com](https://ollama.com) → `ollama pull llama3.2` (or your choice)

```bash
curl http://localhost:11434/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"llama3.2","messages":[{"role":"user","content":"Hello"}]}'
```

**Pan env (local only — Vercel cannot reach your localhost):**
```
LLM_BASE_URL=http://localhost:11434/v1
LLM_API_KEY=ollama
LLM_MODEL=llama3.2
```

Use for: offline Oracle drafts, private code review, Dream Cycle remix without cloud.

## 2. OmniRoute / OmniRouter (self-hosted free gateway)

Multiple projects share the name. Preferred for **free tiers aggregation**:

| Project | Notes |
|---------|--------|
| **OmniRoute** ([diegosouzapw/OmniRoute](https://github.com/diegosouzapw/OmniRoute)) | MIT gateway, many free providers, OpenAI-compatible, works with OpenCode/Cursor |
| omnirouter.li | Hosted multi-model API (prepaid, not fully free) |
| Local OmniRouter (Python) | Self-host one `/v1/chat/completions` for many upstreams |

**Typical local OmniRoute:**
```bash
# example pattern — see upstream README for current install
# API often on localhost:20128 or :9090
curl http://localhost:20128/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"auto","messages":[{"role":"user","content":"Hello"}]}'
```

**Pan env:**
```
LLM_BASE_URL=http://localhost:20128/v1
LLM_API_KEY=  # if required by your gateway
LLM_MODEL=auto
```

## 3. OpenCode (open-source coding agent)

- **What:** MIT coding agent (terminal / desktop / IDE) — not a chat API; an **agent harness** that edits code, runs shell, uses LSP.
- **Install:** `curl -fsSL https://opencode.ai/install | bash` or `npm i -g opencode-ai`
- **Models:** 75+ providers via Models.dev; **Ollama local** supported; optional free models from OpenCode.
- **With Pan:** Point OpenCode at the **pan-copilot** genome repo. Use for code mutations while Pan owns Memory Palace + Linear.

```bash
cd pan-copilot
opencode   # then: "read skills/ and improve bottleneck-finder"
```

Pairing: OpenCode = hands on the genome · Pan = organs + ritual / memory.

## Security
- Never commit API keys.
- Local Ollama stays on machine — good for private data.
- Free upstream gateways may log prompts; prefer Ollama for secrets.

## Heartbeat / synthesize
When `LLM_BASE_URL` is set, Pan reports `meta.live.llm` and can optionally call the gateway for “deep” mode (not required for normal Synth).
