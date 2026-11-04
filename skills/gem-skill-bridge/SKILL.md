---
name: gem-skill-bridge
description: Bundle a Gemini Gem persona (system instructions) with dependent skill manifests into a portable export package for sandbox, edge, or local CLI. Use when unifying Gems with skills, exporting agent runtime packages, or syncing persona + skill metadata.
---

# Gem-Skill Bridge

## Purpose
Bind a **Gem persona** (system instructions, tone, boundaries) to a curated set of **skills** (`SKILL.md` + scripts) and emit a single verified package.

## Layout
```
skills/gem-skill-bridge/
  SKILL.md
  scripts/package_gem_skills.py
  scripts/gem_edge_bootstrap.py
  exports/                  # generated packages land here
```

## Usage
```bash
python skills/gem-skill-bridge/scripts/package_gem_skills.py \
  --gem path/to/gem-persona.md \
  --skill dual-lens --skill zero-copy --skill forge-breakers \
  --out exports/pan-nexus-architect

python skills/gem-skill-bridge/scripts/gem_edge_bootstrap.py \
  --package exports/pan-nexus-architect --post-edge
```

## Package contents
- `manifest.json` — gem id, skills, triggers, timestamps, seals
- `persona.md` — system instructions
- `skills/<name>/SKILL.md` — copied manifests
- `VERIFY.md` — frontmatter + path checks
