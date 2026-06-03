"""FastAPI routes for diagram generation."""

import uuid

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from quantum_reason_adk.schemas import DiagramRequest, FinalAnswer

from ..services.runner import workflow_runner

router = APIRouter()


@router.post("/diagram", response_model=FinalAnswer)
async def generate_diagram(req: DiagramRequest):
    session_id = str(uuid.uuid4())
    try:
        _, result = await workflow_runner.run(
            user_prompt=req.user_prompt,
            mode=req.mode,
            style_hint=req.style_hint,
            history=[t.model_dump() for t in req.history],
            prior_tikz=req.prior_tikz,
            session_id=session_id,
        )
        return FinalAnswer(**result)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/diagram/stream")
async def generate_diagram_stream(req: DiagramRequest):
    """Server-Sent Events: step, thinking, partial, done, error."""
    return StreamingResponse(
        workflow_runner.stream(
            user_prompt=req.user_prompt,
            mode=req.mode,
            style_hint=req.style_hint,
            history=[t.model_dump() for t in req.history],
            prior_tikz=req.prior_tikz,
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
