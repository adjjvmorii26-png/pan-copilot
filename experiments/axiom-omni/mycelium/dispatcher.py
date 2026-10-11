from __future__ import annotations
from dataclasses import dataclass, field
from typing import List, Optional

@dataclass
class Task:
    task_id: str
    payload: dict = field(default_factory=dict)

@dataclass
class StreamDispatcher:
    node_id: str
    queue: List[Task] = field(default_factory=list)
    def enqueue(self, task_id: str, payload: Optional[dict] = None) -> None:
        self.queue.append(Task(task_id=task_id, payload=payload or {}))
    def claim_next(self, claimant: str) -> Optional[Task]:
        if not self.queue:
            return None
        task = self.queue.pop(0)
        task.payload["claimed_by"] = claimant
        return task
