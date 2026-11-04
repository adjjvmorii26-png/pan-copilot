#!/usr/bin/env python3
"""Gem → Edge bootstrap: load gem-skill-bridge export and optionally POST to Pan edge."""
from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.request
from pathlib import Path
from typing import Any, Optional

DEFAULT_EDGE = "https://pan-copilot-ixpansion-agents.vercel.app/api/edge"


def load_package(package_dir: Path) -> dict[str, Any]:
    manifest_path = package_dir / "manifest.json"
    if not manifest_path.is_file():
        raise FileNotFoundError(f"missing manifest.json in {package_dir}")
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    persona_path = package_dir / "persona.md"
    persona = persona_path.read_text(encoding="utf-8") if persona_path.is_file() else ""
    skills = []
    skills_root = package_dir / "skills"
    for entry in manifest.get("skills", []):
        name = entry.get("name")
        skill_md = skills_root / name / "SKILL.md" if name else None
        body = skill_md.read_text(encoding="utf-8") if skill_md and skill_md.is_file() else ""
        skills.append({"name": name, "seal": entry.get("seal"), "frontmatter": entry.get("frontmatter", {}), "loaded": bool(body), "chars": len(body)})
    return {
        "format": manifest.get("format"),
        "persona_seal": manifest.get("persona_seal"),
        "persona_chars": len(persona),
        "persona_preview": persona[:240].replace("\n", " "),
        "skills": skills,
        "skill_names": [s["name"] for s in skills if s.get("name")],
        "loaded_at": time.time(),
        "package": str(package_dir),
    }


def post_edge(ctx: dict[str, Any], edge_url: str) -> dict[str, Any]:
    body = {
        "agent_id": "gem_edge_bootstrap",
        "cognitive_state": "Architect",
        "mapped": True,
        "triad": {"Gossip": 0.55, "Forge": 0.85, "Time": 0.6},
        "organ_metrics": {"gossip": 0.55, "forge": 0.85, "time": 0.6},
        "gem_bridge": {"format": ctx.get("format"), "persona_seal": ctx.get("persona_seal"), "skills": ctx.get("skill_names")},
    }
    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(edge_url, data=data, headers={"Content-Type": "application/json", "Accept": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=20) as resp:
        raw = resp.read().decode("utf-8", errors="replace")
        try:
            return {"status": resp.status, "body": json.loads(raw)}
        except json.JSONDecodeError:
            return {"status": resp.status, "body": raw[:500]}


def main(argv: Optional[list[str]] = None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--package", required=True)
    ap.add_argument("--post-edge", action="store_true")
    ap.add_argument("--edge", default=DEFAULT_EDGE)
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args(argv)
    try:
        ctx = load_package(Path(args.package))
    except FileNotFoundError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2
    if args.json:
        print(json.dumps(ctx, indent=2))
    else:
        print(f"format:   {ctx.get('format')}")
        print(f"persona:  {ctx.get('persona_seal')}")
        print(f"skills:   {', '.join(ctx.get('skill_names') or [])}")
    if args.post_edge:
        try:
            print("--- edge ---")
            print(json.dumps(post_edge(ctx, args.edge), indent=2)[:1200])
        except Exception as exc:
            print(f"edge error: {type(exc).__name__}: {exc}", file=sys.stderr)
            return 1
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
