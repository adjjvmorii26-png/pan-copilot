"""Phase IX: Quantum Decoherence — Bloch ensemble + amplitude/phase damping."""
from __future__ import annotations
import math
from dataclasses import dataclass, field
from typing import List, Tuple

@dataclass
class QubitState:
    x: float = 0.0
    y: float = 0.0
    z: float = 1.0
    def purity(self) -> float:
        r2 = self.x * self.x + self.y * self.y + self.z * self.z
        return 0.5 * (1.0 + min(1.0, r2))
    def bloch_radius(self) -> float:
        return math.sqrt(self.x * self.x + self.y * self.y + self.z * self.z)

@dataclass
class QuantumDecoherenceSim:
    n_qubits: int = 16
    gamma_amp: float = 0.05
    gamma_phase: float = 0.12
    dt: float = 0.05
    qubits: List[QubitState] = field(default_factory=list)
    history: List[Tuple[float, float, float]] = field(default_factory=list)

    def __post_init__(self) -> None:
        if not self.qubits:
            self.qubits = []
            for i in range(self.n_qubits):
                phase = 2 * math.pi * i / max(1, self.n_qubits)
                if i % 3 == 0:
                    self.qubits.append(QubitState(0.0, 0.0, 1.0))
                elif i % 3 == 1:
                    self.qubits.append(QubitState(0.0, 0.0, -1.0))
                else:
                    self.qubits.append(QubitState(math.cos(phase), math.sin(phase), 0.0))

    def step(self):
        ga = self.gamma_amp * self.dt
        gp = self.gamma_phase * self.dt
        for q in self.qubits:
            decay_xy = math.exp(-(0.5 * ga + gp))
            q.x *= decay_xy
            q.y *= decay_xy
            q.z = 1.0 + (q.z - 1.0) * math.exp(-ga)
        return self.mean_purity(), self.mean_radius()

    def mean_purity(self) -> float:
        return sum(q.purity() for q in self.qubits) / len(self.qubits) if self.qubits else 0.0

    def mean_radius(self) -> float:
        return sum(q.bloch_radius() for q in self.qubits) / len(self.qubits) if self.qubits else 0.0

    def run(self, steps: int = 80, record_every: int = 1) -> dict:
        p0, r0 = self.mean_purity(), self.mean_radius()
        self.history = [(0.0, p0, r0)]
        for i in range(1, steps + 1):
            p, r = self.step()
            if i % record_every == 0:
                self.history.append((i * self.dt, p, r))
        p_final, r_final = self.mean_purity(), self.mean_radius()
        return {
            "n_qubits": self.n_qubits,
            "steps": steps,
            "purity_initial": round(p0, 6),
            "purity_final": round(p_final, 6),
            "radius_final": round(r_final, 6),
            "purity_delta": round(p_final - p0, 6),
        }

    def couple_to_lattice(self, lattice_nodes: dict) -> int:
        if not lattice_nodes:
            return 0
        mean_e = sum(lattice_nodes.values()) / len(lattice_nodes)
        self.gamma_phase *= 1.0 + max(0.0, 1.0 - mean_e)
        return len(self.qubits)
