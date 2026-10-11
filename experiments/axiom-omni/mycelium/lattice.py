from __future__ import annotations
from dataclasses import dataclass, field
from typing import Dict

@dataclass
class QuantumResonantLattice:
    decay_coefficient: float = 0.08
    nodes: Dict[str, float] = field(default_factory=dict)
    def __post_init__(self) -> None:
        if not self.nodes:
            self.nodes = {f"n{i}": 1.0 - i * 0.05 for i in range(8)}
    def prune_entropy(self) -> int:
        dead = []
        for k, v in list(self.nodes.items()):
            nv = v * (1.0 - self.decay_coefficient)
            if nv < 0.05:
                dead.append(k)
            else:
                self.nodes[k] = nv
        for k in dead:
            del self.nodes[k]
        return len(dead)
