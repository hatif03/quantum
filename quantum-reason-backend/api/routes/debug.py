"""Dev-only session log inspection."""

import os

from fastapi import APIRouter, HTTPException

from quantum_reason_adk.logging.session_logger import (
    debug_enabled,
    list_recent_sessions,
    load_session_summary,
    session_folder,
    sessions_root,
)

router = APIRouter()


def _debug_allowed() -> bool:
    return debug_enabled() or os.getenv("QUANTUM_ENV", "").lower() in (
        "dev",
        "development",
        "local",
    )


@router.get("/debug/sessions")
async def list_sessions(limit: int = 50):
    if not _debug_allowed():
        raise HTTPException(status_code=404, detail="Debug API disabled")
    return {"root": str(sessions_root()), "sessions": list_recent_sessions(limit=limit)}


@router.get("/debug/sessions/{session_id}")
async def get_session(session_id: str):
    if not _debug_allowed():
        raise HTTPException(status_code=404, detail="Debug API disabled")
    summary = load_session_summary(session_id)
    if summary is None:
        raise HTTPException(status_code=404, detail="Session not found")
    folder = session_folder(session_id)
    files = []
    if folder.exists():
        files = sorted(
            str(p.relative_to(folder)).replace("\\", "/")
            for p in folder.rglob("*")
            if p.is_file()
        )
    return {"session_id": session_id, "summary": summary, "files": files}
