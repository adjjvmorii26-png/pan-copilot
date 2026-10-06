# Pan dual mode: with you and alone

```
                 ┌─────────────┐
                 │   Human     │
                 └──────┬──────┘
          with Grok     │      solo
     ┌──────────────────┼──────────────────┐
     ▼                  ▼                  ▼
  Grok chat      Morning automation   Browser panel
  + connectors   (pan-morning-oracle)  + service worker
     │                  │                  │
     └────────────┬─────┴──────────────────┘
                  ▼
         Organs (Notion / Linear / Calendar / GitHub)
                  ▲
                  │
            Vercel /api/synthesize
```

## Solo schedule
- Name: `pan-morning-oracle`
- When: daily 09:00 America/New_York
- Does: synthesize → log Memory Palace → short notify

## Solo browser
- Alarm every 2h while Chrome runs
- Caches last synth; badge `!` if bottleneck

## With Grok
- Full creative + engineering loop in this conversation
