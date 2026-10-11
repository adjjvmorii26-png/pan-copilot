import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from axiom_omni import AxiomOmniDaemon

def test_omni_daemon_initialization():
    daemon = AxiomOmniDaemon(node_id="test_omni_node")
    assert daemon.node_id == "test_omni_node"

def test_omni_heartbeat_cycle():
    daemon = AxiomOmniDaemon(node_id="test_heartbeat_node")
    daemon._heartbeat_cycle()
    assert len(daemon.telemetry.spans) == 1
    assert daemon.telemetry.spans[0].operation == "omni_heartbeat"

def test_heartbeat_with_queued_task():
    daemon = AxiomOmniDaemon(node_id="worker")
    daemon.dispatcher.enqueue("task-42", {"kind": "forge"})
    daemon._heartbeat_cycle()
    assert daemon.telemetry.spans[0].attrs["active_task"] == "task-42"

def test_lattice_prune_reduces_or_keeps():
    daemon = AxiomOmniDaemon()
    before = len(daemon.lattice.nodes)
    pruned = daemon.lattice.prune_entropy()
    assert pruned >= 0
    assert len(daemon.lattice.nodes) <= before
