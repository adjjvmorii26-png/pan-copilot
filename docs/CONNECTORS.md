# Connectors Pan can use (Grok-connected)

Updated **2026-11-07**. OAuth connectors work in **With Grok** mode only.

## Primary organs
| Service | Role | Skill |
|---------|------|-------|
| GitHub | Genome | code-lattice · organism-steward |
| Notion | Memory Palace | steward traces |
| Linear | Nervous system · task ledger | organism-steward |
| **Gmail** | Gossip | **google-organ** |
| **Google Calendar** | Time | **google-organ** |
| **Google Drive** | Forge artifacts | **google-organ** |
| Vercel | Edge / pulse / heartbeat | live-reusable-test-surface |
| Netlify | Legacy deploy | — |
| Voice | Oracle whisper | — |
| Gamma | Decks | — |
| Automations | Scheduled alone runs | — |

## Live endpoints
| Endpoint | Version (as of 2026-11-07) |
|----------|----------------------------|
| `GET/POST /api/edge` | **0.9.12-edge** |
| `GET /api/heartbeat` | **0.9.12-heartbeat** |

Base: `https://pan-copilot-ixpansion-agents.vercel.app`

## Google Organ protocol
Treat Gmail + Calendar + Drive as **one sense organ**:
1. Calendar window (RFC3339 + offset)
2. Gmail operators (`newer_than:`, `is:unread`, …)
3. Drive only if files/docs matter
4. Synthesize · act only on explicit intent (prefer drafts)

HUD: `apps/google-organ/` · extension: `apps/google-organ/extension/`

Optional alone-mode Time path: set `CALENDAR_ICS_URL` on the heartbeat runtime (counts / live check only).

## Secondary (available)
| Service | Pan use |
|---------|--------|
| Outlook / Outlook Calendar | Second mail/time organ |
| Figma | Panel / face design |
| Canva | Visual assets |
| Excalidraw | Constellation diagrams |
| Microsoft Teams | Team pulse |
| HyperFrames | Video assets |
| Asana | Task dual-track (if connected) |

## Free external (not Grok OAuth)
| Source | Role |
|--------|------|
| Ollama | Local LLM |
| OmniRoute | Multi-provider gateway |
| OpenCode | Coding agent on genome |

## Skills lattice (Pan-relevant)
| Skill | Note |
|-------|------|
| google-organ | Unifies all Google connectors |
| gem-skill-bridge | Persona + skills → export → edge bootstrap |
| organism-steward | Caretaker; pulls google-organ when connected |
| live-reusable-test-surface | Chamber probes for edge/openclaw/VSA |
| code-lattice | Repo atlas |
| dual-lens / zero-copy / forge-breakers | Pan-Nexus Architect stack |
| report-compass | Status bearings |

## Design rules
1. Add an organ only if it gives a **new sense**.
2. Don’t stack three mailboxes for the same signal.
3. Connector data > model guess; on auth failure name the connector.
4. Irreversible (send, delete, trash): confirm when ambiguous.
5. Task tracking: Linear project *Pan – Panoptic Co-Pilot* is nerves source of truth.
