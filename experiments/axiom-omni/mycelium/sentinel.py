from __future__ import annotations
from dataclasses import dataclass, field
from typing import List

@dataclass
class MycelialSentinel:
    scars: List[str] = field(default_factory=list)
    last_coherence: float = 1.0
    def audit_coherence(self) -> float:
        self.last_coherence = 1.0 if not self.scars else max(0.0, 1.0 - 0.1 * len(self.scars))
        return self.last_coherence
