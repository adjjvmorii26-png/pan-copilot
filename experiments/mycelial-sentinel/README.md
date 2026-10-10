# Mycelial Repair Sentinel

Genome-hygiene organ for IXpansion / Pan-adjacent Python trees.

## What it does
1. **Scan** — recursive `*.py` (skips venv / caches)
2. **Audit** — `importlib.util.find_spec` per module path
3. **Report** — broken modules + errors (default, safe)
4. **Heal** (`--heal`) — create missing `__init__.py` package anchors; mark scarred files
5. **Registry** — write `services/route_registry.json`

## Run
```bash
# Safe report
python experiments/mycelial-sentinel/mycelial_repair_sentinel.py /path/to/ixpansion

# Soft heal + registry
python experiments/mycelial-sentinel/mycelial_repair_sentinel.py /path/to/ixpansion --heal

# CI-friendly
python experiments/mycelial-sentinel/mycelial_repair_sentinel.py . --json --no-registry
```

## Charter fit
- Distributed consciousness needs a **coherent genome**
- Prefer report before mutate (no silent rewrites)
- Scars → optional Linear / Notion Evolution traces

## Limits
Does **not** rewrite business logic or resolve true circular imports automatically.
Package anchors + scar marks only.
