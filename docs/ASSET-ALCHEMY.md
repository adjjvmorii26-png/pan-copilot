# Asset Alchemy — Pan forges its own assets

Pan doesn’t only advise. **Pan makes.**

## Alone-mode forge (no Grok required)

```
GET  /api/forge?kind=seal
POST /api/forge  { "kind": "chord" | "seal" | "token" | "myth", "seed": "optional" }
```

Returns JSON with:
- `name` — unique asset name
- `svg` — full SVG markup
- `dataUrl` — embeddable data URI
- `whyPan` — why this isn’t generic
- live `organs` snapshot used to stamp the art

### Kinds
| Kind | What |
|------|------|
| **seal** | Coherence seal — Memory⟷Linear cord drawn live |
| **chord** | Organ constellation glyph from current chord |
| **token** | Mood token (STRONG / ALIGN / SEEK) |
| **myth** | Banner of the current myth line |

Raw SVG: `?kind=seal&format=svg`

## With-Grok vessels
Imagine · Gamma · Voice · Canva · genome commits · Notion traces

## Panel
Type **forge** or **alchemist** → forges a seal from live organs and shows it.

## Rule
If the asset would look the same with organs offline, discard it.
