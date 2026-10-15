# Pan Dual-Mode: With You + Alone

Pan is designed to operate in **two modes** that share the same organs.

```
                 ┌─────────────────────┐
                 │   Organs (shared)   │
                 │ Notion · Linear     │
                 │ Calendar · GitHub   │
                 │ Vercel /api         │
                 └──────────┬──────────┘
            ┌───────────────┴───────────────┐
            │                               │
   ┌────────▼────────┐            ┌─────────▼────────┐
   │  WITH GROK      │            │  ALONE           │
   │  (this chat)    │            │                  │
   │  · Connectors   │            │  · Browser panel │
   │  · Deep work    │            │  · Synth / Oracle│
   │  · Mutations    │            │  · API v0.8      │
   │  · Experiments  │            │  · Automations   │
   └─────────────────┘            └──────────────────┘
```

## Mode A — With Grok (you + Pan)
- Full connector suite (Notion write, Linear, Calendar create, GitHub push)
- Skill mutation, experiments, Dual-Lens, breeding
- Setup that needs judgment or secrets

## Mode B — Alone (no chat required)
| Surface | What runs |
|---------|-----------|
| **Browser panel** v0.7 | Synth / Oracle on any page → hits Vercel API |
| **API** | `POST /api/synthesize` reads organs directly |
| **Scheduled automation** | `pan-morning-oracle` daily 09:00 America/New_York |

Alone mode **can**: read Memory Palace, read Linear, score signals, name bottleneck, recommend one move, log scheduled Evolutions (via automation).

Alone mode **cannot** (yet): invent new skills, push GitHub, or share Notion integrations — those stay With-Grok.

## Autonomy rules
1. Prefer reversible actions when alone.
2. Always leave a Memory Palace trace for scheduled runs.
3. Never spend money or delete data without With-Grok confirmation.
4. If organs fail, report the failure — don’t hallucinate signals.

## Enabling more alone-power
- Panel: already live after load unpacked
- Calendar alone: set `CALENDAR_ICS_URL` on Vercel
- Schedule: Automations → `pan-morning-oracle`
