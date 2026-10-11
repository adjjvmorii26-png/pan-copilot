"""Phase VIII: Axiom Omni-Daemon"""
from __future__ import annotations
import time
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parent))
from mycelium.sentinel import MycelialSentinel
from mycelium.lattice import QuantumResonantLattice
from mycelium.crdt import ConflictFreeReplicatedState
from mycelium.dispatcher import StreamDispatcher
from telemetry.collector import MetabolicCollector

class AxiomOmniDaemon:
    def __init__(self, node_id: str = "AXIOM-9-PRIME"):
        self.node_id = node_id
        self.sentinel = MycelialSentinel()
        self.lattice = QuantumResonantLattice(decay_coefficient=0.08)
        self.state = ConflictFreeReplicatedState(node_id)
        self.dispatcher = StreamDispatcher(node_id)
        self.telemetry = MetabolicCollector(node_id)

    def _heartbeat_cycle(self) -> None:
        start_time = time.time()
        self.sentinel.audit_coherence()
        pruned = self.lattice.prune_entropy()
        task = self.dispatcher.claim_next(self.node_id)
        task_status = task.task_id if task else "idle"
        duration = (time.time() - start_time) * 1000.0
        cost = min(1.0, duration / 100.0)
        self.telemetry.record_span(
            "omni_heartbeat", duration, cost,
            {"pruned_nodes": pruned, "active_task": task_status},
        )
        self.state.set("last_heartbeat_ms", duration)
        self.state.set("last_task", task_status)

if __name__ == "__main__":
    daemon = AxiomOmniDaemon()
    daemon._heartbeat_cycle()
    span = daemon.telemetry.spans[-1]
    print(f"[AXIOM-9] node={daemon.node_id} op={span.operation} ms={span.duration_ms:.3f} cost={span.cost:.4f} attrs={span.attrs}")
