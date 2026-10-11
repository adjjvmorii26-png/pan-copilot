# Axiom Omni-Daemon (Phase VIII)

Runnable daemon bonding sentinel · lattice · CRDT · dispatcher · telemetry.

```bash
cd experiments/axiom-omni   # or artifacts/axiom-omni
python axiom_omni.py
python -m pytest tests/ -q
```

**Verification:** 4/4 tests passed (init, heartbeat, queued task, lattice prune).
