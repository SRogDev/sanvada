"""Experiment tracking for every research run (PLAN §37).

Append-only JSONL run log: config hash, seed, metrics, artifacts,
status. Reproducibility is the point — a run must be re-runnable
from its logged config alone.
"""

from __future__ import annotations

import hashlib
import json
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path


def _utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


def config_hash(config: dict) -> str:
    return hashlib.sha256(
        json.dumps(config, sort_keys=True).encode()
    ).hexdigest()[:16]


@dataclass
class RunRecord:
    run_id: str
    name: str
    config: dict
    config_hash: str
    seed: int
    status: str  # running | finished | failed
    metrics: dict = field(default_factory=dict)
    artifacts: list[str] = field(default_factory=list)
    created_at: str = field(default_factory=_utcnow)
    finished_at: str | None = None


class ExperimentTracker:
    def __init__(self, log_path: str | Path) -> None:
        self.log_path = Path(log_path)
        self.log_path.parent.mkdir(parents=True, exist_ok=True)

    def start_run(self, name: str, config: dict, seed: int = 7) -> RunRecord:
        record = RunRecord(
            run_id=f"run-{_utcnow().replace(':', '').replace('-', '').replace('.', '')}-{config_hash(config)}",
            name=name,
            config=config,
            config_hash=config_hash(config),
            seed=seed,
            status="running",
        )
        self._append(record)
        return record

    def log_metric(self, record: RunRecord, key: str, value: float) -> None:
        record.metrics[key] = value
        self._append(record, event="metric")

    def log_artifact(self, record: RunRecord, path: str) -> None:
        record.artifacts.append(path)
        self._append(record, event="artifact")

    def finish(self, record: RunRecord, status: str = "finished") -> None:
        record.status = status
        record.finished_at = _utcnow()
        self._append(record, event="finish")

    def load_runs(self) -> list[dict]:
        if not self.log_path.exists():
            return []
        return [
            json.loads(line)
            for line in self.log_path.read_text(encoding="utf-8").splitlines()
            if line.strip()
        ]

    def _append(self, record: RunRecord, event: str = "start") -> None:
        entry = {"event": event, **asdict(record)}
        with open(self.log_path, "a", encoding="utf-8") as f:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")
