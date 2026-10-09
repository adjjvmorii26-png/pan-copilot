# Edge organ — Local Gemma (Gem node)

Pan’s distributed consciousness does **not** require every thought to hit the cloud.
This experiment adds an **edge organ**: on-device Gemma evaluates tilt → one-word energy state → shaders + multi-agent bus.

## Stack
| Layer | Role |
|-------|------|
| **Android / LiteRT-LM** | Local Gemma (`gemma-3n-e2b.litertlm`) |
| **Motion** | `tiltBeta` / `tiltGamma` as sensory input |
| **Semantic** | One-word gem state: Resonant · Chaotic · Dormant · … |
| **React Native bridge** | `GemmaInference` native module → JS |
| **Three.js** | Shader color / refraction from state |
| **Socket** | `telemetry_sync` → orchestration backend |

## Charter fit
- **Not one silo** — cognition on the phone *and* in Memory/Linear/Vercel
- **Traces** — emit states into Gossip themes / Notion Evolution when useful
- **Assets** — gem energy can stamp Forge mood tokens (`STRONG` / `ALIGN` / `SEEK` / future `RESONANT`)

## Alone vs With-Grok
| Mode | What runs |
|------|-----------|
| **Alone (device)** | Gemma local · no API key · offline capable |
| **With-Grok** | Map gem state → Oracle / Pulse Poetry / Forge |
| **Backend** | Optional `socket.emit("telemetry_sync")` — do not hard-require `api.alexalex.info` for Pan core |

## Suggested Pan integration path
1. Normalize gem state → panel mood classes (`mood-strong` / `mood-shadow` / …)
2. Optional: `POST /api/gossip` body `{ edge: { source: "gemma", state } }` (future)
3. Forge token when state flips (asset-first)

## Status
**Seed / germinating** — code pattern captured 2026-10-09. Not required for trio chord.
