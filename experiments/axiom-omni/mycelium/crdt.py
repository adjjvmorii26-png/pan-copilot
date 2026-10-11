from __future__ import annotations
import time
from dataclasses import dataclass, field
from typing import Any, Dict, Tuple

@dataclass
class ConflictFreeReplicatedState:
    node_id: str
    _store: Dict[str, Tuple[Any, float, str]] = field(default_factory=dict)
    def set(self, key: str, value: Any) -> None:
        self._store[key] = (value, time.time(), self.node_id)
    def get(self, key: str, default: Any = None) -> Any:
        entry = self._store.get(key)
        return entry[0] if entry else default
    def merge(self, other: "ConflictFreeReplicatedState") -> None:
        for k, (v, ts, origin) in other._store.items():
            cur = self._store.get(k)
            if cur is None or ts > cur[1] or (ts == cur[1] and origin > cur[2]):
                self._store[k] = (v, ts, origin)
