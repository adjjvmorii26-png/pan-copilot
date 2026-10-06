# Local Runtime — Ollama + OpenCode on the Genome

Run **OpenCode inside this repo against a local Ollama model** — fully offline,
no API keys, no cloud. The genome (`AGENT.md`, `skills/`, `docs/`) is then the
working directory an agent reads while it edits.

## Prerequisites

- [Ollama](https://ollama.com) installed and running on the same machine
- [OpenCode](https://opencode.ai) installed (`curl -fsSL https://opencode.ai/install | bash`
  or `npm install -g opencode-ai`)
- A host where both binaries can execute (a normal Linux/macOS shell).
  Android/Vscodroid shells deny execution of both — run this on a real machine,
  or point `baseURL` below at a remote Ollama.

## Run

```bash
# Ollama
ollama pull llama3.2

# Optional env for local bridge / tools
export LLM_BASE_URL=http://localhost:11434/v1
export LLM_API_KEY=ollama
export LLM_MODEL=llama3.2

# OpenCode on the genome
cd pan-copilot && opencode
```

## What `opencode.json` wires up

```json
{
  "$schema": "https://opencode.ai/config.json",
  "model": "ollama/llama3.2",
  "small_model": "ollama/llama3.2",
  "instructions": ["AGENT.md"],
  "provider": {
    "ollama": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "Ollama",
      "options": {
        "baseURL": "http://localhost:11434/v1",
        "apiKey": "ollama"
      },
      "models": {
        "llama3.2": { "name": "Llama 3.2" }
      }
    }
  }
}
```

- **Provider** — Ollama's OpenAI-compatible endpoint via `@ai-sdk/openai-compatible`,
  exactly as documented in the [Ollama ↔ OpenCode guide](https://docs.ollama.com/integrations/opencode).
  `apiKey` is a placeholder Ollama ignores; it is not a secret.
- **`model` / `small_model`** — defaults to `ollama/llama3.2` for the main and
  background (titles/summaries) calls, so nothing silently falls back to a cloud
  provider. Switch interactively with `/models` inside the TUI.
- **`instructions: ["AGENT.md"]`** — loads the Pan charter as standing context,
  the same as OpenCode loading an `AGENTS.md`.
- The `LLM_*` exports above are for **other tools/bridges** that speak the
  OpenAI protocol; `opencode.json` pins the same values itself, so OpenCode
  works even without them.

## Verify the bridge

```bash
ollama list                                  # llama3.2 present
curl http://localhost:11434/api/tags         # server alive
```

Notes:

- `llama3.2` advertises a 128k context window, above OpenCode's 64k minimum.
- Running Ollama on another machine: set `baseURL` to
  `http://<host-ip>:11434/v1` in `opencode.json`.
- Keep Ollama running while the session lives; OpenCode reconnects per request
  and will fail mid-session if the server stops.
