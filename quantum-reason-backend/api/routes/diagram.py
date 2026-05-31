"""FastAPI routes for diagram generation."""

import uuid

from fastapi import APIRouter, HTTPException

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
            session_id=session_id,
        )
        return FinalAnswer(**result)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
