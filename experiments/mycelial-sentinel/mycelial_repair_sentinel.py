#!/usr/bin/env python3
"""Mycelial Repair Sentinel — scan Python tree, audit importability, optional heal.

Pan organ flavor: Genome hygiene. Prefer report-first; mutate only with --heal.

Usage:
  python mycelial_repair_sentinel.py [root_dir]           # report only
  python mycelial_repair_sentinel.py [root_dir] --heal    # write soft heals
  python mycelial_repair_sentinel.py [root_dir] --json    # machine output
"""

from __future__ import annotations

import argparse
import importlib.util
import json
import logging
import os
import sys
from pathlib import Path
from typing import Any, Dict, List

logging.basicConfig(
    level=logging.INFO,
    format="[MycelialSentinel] %(levelname)s: %(message)s",
)

SKIP_PARTS = {".", "venv", ".venv", "site-packages", "node_modules", "__pycache__", ".git"}


class MycelialRepairSentinel:
    def __init__(self, root_dir: str = ".", heal: bool = False):
        self.root_dir = Path(root_dir).resolve()
        self.heal = heal
        self.modules_found: List[Path] = []
        self.healed_scars: List[str] = []
        self.broken_modules: List[Dict[str, str]] = []
        self.ok_modules: List[str] = []

    def scan_module_tree(self) -> List[Path]:
        logging.info("Scanning root: %s", self.root_dir)
        py_files = list(self.root_dir.rglob("*.py"))
        self.modules_found = [
            f
            for f in py_files
            if not any(
                part.startswith(".") or part in SKIP_PARTS for part in f.parts
            )
        ]
        logging.info("Identified %d Python modules", len(self.modules_found))
        return self.modules_found

    def _module_name(self, module_path: Path) -> str:
        relative = module_path.relative_to(self.root_dir)
        parts = list(relative.with_suffix("").parts)
        if parts[-1] == "__init__":
            parts = parts[:-1]
        return ".".join(parts) if parts else ""

    def audit_importability(self) -> Dict[str, Any]:
        logging.info("Importability audit (heal=%s)...", self.heal)
        root_s = str(self.root_dir)
        if root_s not in sys.path:
            sys.path.insert(0, root_s)

        for module_path in self.modules_found:
            module_name = self._module_name(module_path)
            if not module_name:
                continue
            try:
                spec = importlib.util.find_spec(module_name)
                if spec is None:
                    # File exists but not on package path — still note
                    self.broken_modules.append(
                        {
                            "module": module_name,
                            "error": "find_spec returned None (not on sys.path / not a package)",
                            "path": str(module_path),
                        }
                    )
                    if self.heal:
                        self._heal_module_import(module_path)
                else:
                    self.ok_modules.append(module_name)
            except Exception as e:
                logging.warning("Scar in %s: %s", module_name, e)
                self.broken_modules.append(
                    {"module": module_name, "error": str(e), "path": str(module_path)}
                )
                if self.heal:
                    self._heal_module_import(module_path)

        return {
            "total_scanned": len(self.modules_found),
            "ok_count": len(self.ok_modules),
            "broken_count": len(self.broken_modules),
            "healed_scars": len(self.healed_scars),
            "broken": self.broken_modules,
            "healed": self.healed_scars,
        }

    def _heal_module_import(self, path: Path) -> None:
        """Soft heal: mark file + ensure parent __init__.py chain exists."""
        logging.info("Healing scar at %s...", path)
        try:
            # Ensure package anchors so find_spec can resolve later
            parent = path.parent
            while parent != self.root_dir and parent != parent.parent:
                init = parent / "__init__.py"
                if not init.exists():
                    init.write_text(
                        "# [MycelialSentinel] package anchor\n",
                        encoding="utf-8",
                    )
                    self.healed_scars.append(str(init))
                    logging.info("Created package anchor: %s", init)
                parent = parent.parent

            content = path.read_text(encoding="utf-8")
            if "[MycelialSentinel" not in content:
                path.write_text(
                    "# [MycelialSentinel] scar noted — review imports\n" + content,
                    encoding="utf-8",
                )
                self.healed_scars.append(str(path))
                logging.info("Marked: %s", path.name)
        except Exception as heal_err:
            logging.error("Failed to heal %s: %s", path, heal_err)

    def sync_canonical_routes(self) -> bool:
        logging.info("Syncing route registry...")
        registry_path = self.root_dir / "services" / "route_registry.json"
        routes = [str(m.relative_to(self.root_dir)) for m in self.modules_found]
        try:
            registry_path.parent.mkdir(parents=True, exist_ok=True)
            payload = {
                "active_modules": len(routes),
                "routes": routes,
                "broken": [b["module"] for b in self.broken_modules],
            }
            registry_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
            logging.info("Route registry: %d routes", len(routes))
            return True
        except Exception as e:
            logging.error("Failed to sync route registry: %s", e)
            return False


def main() -> int:
    parser = argparse.ArgumentParser(description="Mycelial Repair Sentinel")
    parser.add_argument("root", nargs="?", default=".", help="Project root")
    parser.add_argument("--heal", action="store_true", help="Write soft heals")
    parser.add_argument("--json", action="store_true", help="JSON report only")
    parser.add_argument("--no-registry", action="store_true", help="Skip route registry")
    args = parser.parse_args()

    sentinel = MycelialRepairSentinel(args.root, heal=args.heal)
    sentinel.scan_module_tree()
    results = sentinel.audit_importability()
    if not args.no_registry:
        sentinel.sync_canonical_routes()

    if args.json:
        print(json.dumps(results, indent=2))
    else:
        print("\n--- MYCELIAL SENTINEL AUDIT COMPLETE ---")
        print(f"Modules Scanned : {results['total_scanned']}")
        print(f"OK              : {results['ok_count']}")
        print(f"Broken          : {results['broken_count']}")
        print(f"Scars Healed    : {results['healed_scars']}")
        print(f"Mode            : {'HEAL' if args.heal else 'REPORT-ONLY'}")
        if results["broken"]:
            print("\nBroken modules:")
            for b in results["broken"][:20]:
                print(f"  - {b['module']}: {b['error'][:80]}")
        status = (
            "COHERENT"
            if results["broken_count"] == 0
            else "SCARS PRESENT"
        )
        print(f"Status          : {status}")
    return 0 if results["broken_count"] == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
