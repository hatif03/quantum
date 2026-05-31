"""FastAPI routes for math explanation."""

import uuid

from fastapi import APIRouter, HTTPException

from quantum_reason_adk.schemas import ExplainRequest, ExplainResponse, WorkflowMode

from ..services.runner import workflow_runner

router = APIRouter()


@router.post("/explain", response_model=ExplainResponse)
async def explain_physics(req: ExplainRequest):
    session_id = str(uuid.uuid4())
    prompt = req.user_prompt
    if req.context:
        prompt = f"{req.user_prompt}\n\nContext:\n{req.context}"
    try:
        _, result = await workflow_runner.run(
            user_prompt=prompt,
            mode=WorkflowMode.EXPLAIN,
            session_id=session_id,
        )
        math = result.get("math_explanation")
        if not math:
            raise HTTPException(status_code=502, detail="Math explainer did not return structured output")
        return ExplainResponse(
            math_explanation=math,
            summary=result.get("summary"),
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
