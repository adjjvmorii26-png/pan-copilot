from __future__ import annotations
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

@dataclass
class Span:
    operation: str
    duration_ms: float
    cost: float
    attrs: Dict[str, Any] = field(default_factory=dict)

@dataclass
class MetabolicCollector:
    node_id: str
    spans: List[Span] = field(default_factory=list)
    def record_span(self, operation: str, duration_ms: float, cost: float, attrs: Optional[Dict[str, Any]] = None) -> Span:
        span = Span(operation=operation, duration_ms=duration_ms, cost=cost, attrs=attrs or {})
        self.spans.append(span)
        return span
