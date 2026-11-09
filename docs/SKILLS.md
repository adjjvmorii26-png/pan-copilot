# Pan Skills

Updated **2026-11-08**. Skills are modular execution recipes. Pan loads them **with Grok**; alone mode may only recommend.

## Sense & steward
- **google-organ** — Gmail + Calendar + Drive pulse (primary sense)
- **organism-steward** — IXPANSION / Pan health reports (includes Google pulse when live)
- **report-compass** — Health · Drift · Opportunity · Silence

## Bridge & package
- **omni-bridge** — sealed skill synthesizer + experimental connector pack
  - `scripts/omni_bridge_synthesizer.py`
  - `skills/omni-bridge.md`
- **gem-skill-bridge** — Gem persona + dependent skills → `manifest.json` package
  - `scripts/package_gem_skills.py`
  - `scripts/gem_edge_bootstrap.py` (--post-edge)

## Experimental connector lattice (omni-bridge 0.1)
| Skill | Connectors |
|-------|------------|
| connector-constellation | Gmail · Calendar · Drive · Notion · Linear · GitHub |
| asana-nerve-bridge | Asana · Linear |
| vercel-pulse-witness | Vercel · GitHub · Notion |
| ghost-meeting-forger | Calendar · Drive · Gmail |
| automations-alone-heartbeat | Automations · Notion · Linear |
| voice-oracle-whisper | Voice · Notion |
| gamma-deck-alchemist | Gamma · Notion |
| vsa-omni-weaver | GitHub · Vercel |

## Genome & mesh
- **code-lattice** — multi-repo traversal
- **live-reusable-test-surface** — edge / openclaw / VSA / bridge chamber
- **dual-lens · zero-copy · forge-breakers** — architect performance stack

## Ritual (legacy names still in docs)
Context Synthesis · Ritual Oracle · Shadow · Signal Compost · Asset Alchemist · Autonomous Run · Dream · Resonance

## Rule
Compost before adding. Prefer extending **google-organ**, **organism-steward**, or **omni-bridge** over a third mail skill.

## Version alignment
Edge and heartbeat contract: **0.9.12**. Skills that post to `/api/edge` should accept that version string.
