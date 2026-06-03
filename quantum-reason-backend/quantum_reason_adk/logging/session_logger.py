"""Persist per-request session artifacts for debugging (no manual thinking.md paste)."""

from __future__ import annotations

import json
import logging
import os
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

logger = logging.getLogger(__name__)

_LOG_DIR = Path(os.getenv("QUANTUM_LOG_DIR", "./logs/sessions"))
_LOG_RAW = os.getenv("QUANTUM_LOG_RAW_K2", "true").lower() in ("1", "true", "yes")
_DEBUG = os.getenv("QUANTUM_DEBUG", "0").lower() in ("1", "true", "yes")


def debug_enabled() -> bool:
    return _DEBUG


def sessions_root() -> Path:
    return _LOG_DIR


def _safe_id(session_id: str) -> str:
    return re.sub(r"[^\w\-]", "_", session_id)[:64]


class SessionLogger:
    """Write structured artifacts under QUANTUM_LOG_DIR/<session_id>/."""

    def __init__(
        self,
        session_id: str,
        *,
        prompt: str = "",
        mode: str = "",
        model: str = "",
    ) -> None:
        self.session_id = session_id
        self._dir = _LOG_DIR / _safe_id(session_id)
        self._events_path = self._dir / "events.jsonl"
        self._started = datetime.now(timezone.utc).isoformat()
        self._summary: dict[str, Any] = {
            "session_id": session_id,
            "parse_warnings": [],
            "panels": [],
            "durations_ms": {},
        }
        try:
            self._dir.mkdir(parents=True, exist_ok=True)
            (self._dir / "raw").mkdir(exist_ok=True)
            (self._dir / "parsed").mkdir(exist_ok=True)
            (self._dir / "compile").mkdir(exist_ok=True)
            meta = {
                "session_id": session_id,
                "prompt": prompt[:2000],
                "mode": mode,
                "model": model,
                "started_at": self._started,
            }
            (self._dir / "meta.json").write_text(
                json.dumps(meta, indent=2), encoding="utf-8"
            )
        except OSError as exc:
            logger.warning("Session log dir unavailable: %s", exc)

    @property
    def path(self) -> Path:
        return self._dir

    def event(self, step: str, **payload: Any) -> None:
        line = {"ts": datetime.now(timezone.utc).isoformat(), "step": step, **payload}
        try:
            with self._events_path.open("a", encoding="utf-8") as fh:
                fh.write(json.dumps(line, default=str) + "\n")
        except OSError:
            pass

    def log_raw_response(self, phase: str, text: str) -> None:
        if not _LOG_RAW or not text:
            return
        name = {
            "lesson_planner": "plan_response.txt",
            "diagram_lesson": "lesson_response.txt",
            "math_explainer": "math_response.txt",
        }.get(phase, f"{phase}_response.txt")
        try:
            (self._dir / "raw" / name).write_text(text, encoding="utf-8")
        except OSError as exc:
            logger.debug("Could not write raw %s: %s", name, exc)
        self.event("raw", phase=phase, chars=len(text))

    def log_parsed(self, name: str, data: Optional[dict[str, Any]]) -> None:
        path = self._dir / "parsed" / f"{name}.json"
        try:
            path.write_text(
                json.dumps(data, indent=2, default=str) if data else "null",
                encoding="utf-8",
            )
        except OSError:
            pass
        self.event("parse", artifact=name, ok=data is not None)

    def log_parse_warning(self, key: str) -> None:
        warnings = self._summary.setdefault("parse_warnings", [])
        if key not in warnings:
            warnings.append(key)

    def log_panel_compile(
        self,
        panel_id: str,
        *,
        tikz: str,
        ok: bool,
        log_content: str = "",
        errors: Optional[list] = None,
    ) -> None:
        preview = (tikz or "")[:80].replace("\n", " ")
        panels = self._summary.setdefault("panels", [])
        panels.append(
            {
                "id": panel_id,
                "compile_ok": ok,
                "tikz_preview": preview,
                "errors": errors or [],
            }
        )
        compile_dir = self._dir / "compile"
        try:
            (compile_dir / f"{panel_id}.tex").write_text(tikz or "", encoding="utf-8")
            if log_content:
                (compile_dir / f"{panel_id}.log").write_text(
                    log_content[-8000:], encoding="utf-8"
                )
        except OSError:
            pass
        self.event("compile", panel_id=panel_id, ok=ok, preview=preview)

    def finalize(self, state: dict[str, Any]) -> None:
        self._summary["parse_warnings"] = state.get("parse_warnings") or []
        self._summary["workflow_step"] = state.get("workflow_step")
        self._summary["finished_at"] = datetime.now(timezone.utc).isoformat()
        try:
            (self._dir / "summary.json").write_text(
                json.dumps(self._summary, indent=2, default=str),
                encoding="utf-8",
            )
        except OSError:
            pass

    def list_files(self) -> list[str]:
        if not self._dir.exists():
            return []
        return sorted(
            str(p.relative_to(self._dir)).replace("\\", "/")
            for p in self._dir.rglob("*")
            if p.is_file()
        )


def list_recent_sessions(limit: int = 50) -> list[dict[str, Any]]:
    root = sessions_root()
    if not root.exists():
        return []
    entries: list[dict[str, Any]] = []
    for child in sorted(root.iterdir(), key=lambda p: p.stat().st_mtime, reverse=True):
        if not child.is_dir():
            continue
        summary_path = child / "summary.json"
        meta_path = child / "meta.json"
        entry: dict[str, Any] = {"id": child.name, "path": str(child)}
        if summary_path.exists():
            try:
                entry["summary"] = json.loads(summary_path.read_text(encoding="utf-8"))
            except json.JSONDecodeError:
                pass
        if meta_path.exists():
            try:
                entry["meta"] = json.loads(meta_path.read_text(encoding="utf-8"))
            except json.JSONDecodeError:
                pass
        entries.append(entry)
        if len(entries) >= limit:
            break
    return entries


def session_folder(session_id: str) -> Path:
    return sessions_root() / _safe_id(session_id)


def load_session_summary(session_id: str) -> Optional[dict[str, Any]]:
    summary_path = session_folder(session_id) / "summary.json"
    if not summary_path.exists():
        return None
    return json.loads(summary_path.read_text(encoding="utf-8"))
