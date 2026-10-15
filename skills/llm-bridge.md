# Skill: LLM Bridge  v1.0

**Purpose**  
Optional deep reasoning via **Ollama**, **OmniRoute**, or any OpenAI-compatible `LLM_BASE_URL`.

**When to invoke**
- User says “deep”, “local model”, “ollama”, “ask the local brain”
- Dream Cycle / complex synthesis when organs alone are thin
- Offline / private context

**Config**
```
LLM_BASE_URL=http://localhost:11434/v1   # Ollama default
LLM_API_KEY=ollama
LLM_MODEL=llama3.2
```
OmniRoute example: `http://localhost:20128/v1`, model `auto`.

**Process**
1. Build a short system prompt: Pan identity + organ signals summary.
2. POST `{base}/chat/completions` with messages.
3. Label reply as **LLM Bridge** — never mix with organ facts without marking.

**Guardrails**
- Organ data > model opinion.
- Vercel production cannot call user localhost — bridge is local/panel or self-hosted public URL.
- Don’t send secrets to free remote gateways.

**Mutation Potential**: High
