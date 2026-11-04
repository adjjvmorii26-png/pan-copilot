#!/usr/bin/env python3
"""Gem-Skill Bridge — package a Gemini Gem persona with dependent skill manifests."""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import sys
import time
from pathlib import Path
from typing import Any, Optional

FRONTMATTER_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.DOTALL)
DEFAULT_SKILL_ROOTS = [
    Path("/home/workdir/.grok/skills"),
    Path("/root/.grok/skills"),
]


def parse_frontmatter(text: str) -> tuple[dict[str, Any], str]:
    m = FRONTMATTER_RE.match(text)
    if not m:
        return {}, text
    meta: dict[str, Any] = {}
    for line in m.group(1).splitlines():
        if ":" not in line:
            continue
        k, v = line.split(":", 1)
        meta[k.strip()] = v.strip().strip(\"\"\"')
    return meta, text[m.end():]


def sha256_file(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def find_skill(name: str, roots: list[Path]) -> Optional[Path]:
    for root in roots:
        cand = root / name / "SKILL.md"
        if cand.is_file():
            return cand
    return None


def package(gem_path: Path, skill_names: list[str], roots: list[Path], out_dir: Path, dry_run: bool = False) -> dict[str, Any]:
    if not gem_path.is_file():
        raise FileNotFoundError(f"gem persona not found: {gem_path}")
    persona = gem_path.read_text(encoding="utf-8")
    persona_seal = hashlib.sha256(persona.encode("utf-8")).hexdigest()
    resolved, missing = [], []
    for name in skill_names:
        path = find_skill(name, roots)
        if path is None:
            missing.append(name)
            continue
        text = path.read_text(encoding="utf-8")
        meta, _ = parse_frontmatter(text)
        resolved.append({"name": name, "path": str(path), "meta": meta, "seal": sha256_file(path), "bytes": path.stat().st_size})
    report = {"ok": not missing, "gem": str(gem_path), "persona_seal": persona_seal, "skills_resolved": resolved, "skills_missing": missing, "out": str(out_dir), "ts": time.time()}
    if dry_run or missing:
        return report
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "persona.md").write_text(persona, encoding="utf-8")
    for item in resolved:
        dest = out_dir / "skills" / item["name"]
        dest.mkdir(parents=True, exist_ok=True)
        src = Path(item["path"])
        shutil.copy2(src, dest / "SKILL.md")
        aux = src.parent / "scripts"
        if aux.is_dir():
            shutil.copytree(aux, dest / "scripts", dirs_exist_ok=True)
    manifest = {
        "format": "gem-skill-bridge/v1",
        "gem_file": gem_path.name,
        "persona_seal": f"sha256:{persona_seal}",
        "skills": [{"name": s["name"], "seal": f"sha256:{s['seal']}", "frontmatter": s["meta"]} for s in resolved],
        "timestamp": report["ts"],
        "roots_searched": [str(r) for r in roots],
    }
    (out_dir / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    lines = ["# VERIFY", f"- persona seal: sha256:{persona_seal}", f"- skills: {len(resolved)} resolved, {len(missing)} missing"]
    for s in resolved:
        lines.append(f"- OK {s['name']}  sha256:{s['seal'][:12]}…")
    for m in missing:
        lines.append(f"- MISSING {m}")
    (out_dir / "VERIFY.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    report["manifest"] = manifest
    return report


def main(argv: Optional[list[str]] = None) -> int:
    ap = argparse.ArgumentParser(description="Package Gem persona + skill manifests")
    ap.add_argument("--gem", required=True)
    ap.add_argument("--skill", action="append", default=[])
    ap.add_argument("--skills-root", action="append", default=[])
    ap.add_argument("--out", default="exports/gem-package")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args(argv)
    mesh_skills = Path(__file__).resolve().parents[2]
    roots = [Path(p) for p in args.skills_root] + DEFAULT_SKILL_ROOTS + [mesh_skills]
    if not args.skill:
        print("error: provide at least one --skill", file=sys.stderr)
        return 2
    try:
        report = package(Path(args.gem), args.skill, roots, Path(args.out), args.dry_run)
    except FileNotFoundError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2
    print(json.dumps({k: report[k] for k in report if k != "manifest"}, indent=2))
    if report["skills_missing"]:
        print("missing:", ", ".join(report["skills_missing"]), file=sys.stderr)
        return 1
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
