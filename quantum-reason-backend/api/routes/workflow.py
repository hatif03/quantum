"""SSE workflow event stream."""

import asyncio
import json

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from ..services.runner import workflow_runner

router = APIRouter()


@router.get("/workflow/stream")
async def workflow_stream(session_id: str):
    async def event_generator():
        sent = 0
        for _ in range(600):
            history = workflow_runner.get_history(session_id)
            while sent < len(history):
                yield f"data: {json.dumps(history[sent])}\n\n"
                sent += 1
            await asyncio.sleep(0.5)
            if sent > 0 and history and history[-1].get("step") == "feedback":
                break

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )
