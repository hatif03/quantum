"""ADK Runner service for Quantum Reason workflows."""

import asyncio
import logging
import uuid
from typing import Any, AsyncGenerator, Callable, Optional

from google.adk.agents.run_config import RunConfig, StreamingMode
from google.adk.runners import Runner
from google.adk.sessions.in_memory_session_service import InMemorySessionService
from google.genai import types

from quantum_reason_adk.schemas import WorkflowMode
from quantum_reason_adk.sub_agents.tikz_validator_agent import compile_tikz_tool
from quantum_reason_adk.tools.kb.local import search_local_kb
from quantum_reason_adk.workflow import get_workflow

from .events import agent_to_step
from .parser import state_to_final_answer

logger = logging.getLogger(__name__)

APP_NAME = "quantum_reason"


class WorkflowRunner:
    def __init__(self) -> None:
        self._session_service = InMemorySessionService()
        self._event_subscribers: dict[str, list[Callable[[dict], None]]] = {}
        self._event_history: dict[str, list[dict]] = {}

    def _pipeline_for_mode(self, mode: WorkflowMode):
        return get_workflow(mode.value)

    async def run(
        self,
        user_prompt: str,
        mode: WorkflowMode = WorkflowMode.DIAGRAM,
        style_hint: Optional[str] = None,
        session_id: Optional[str] = None,
    ) -> tuple[str, dict]:
        session_id = session_id or str(uuid.uuid4())
        agent = self._pipeline_for_mode(mode)
        runner = Runner(
            app_name=APP_NAME,
            agent=agent,
            session_service=self._session_service,
            auto_create_session=True,
        )

        prompt = user_prompt
        if style_hint:
            prompt = f"{user_prompt}\n\nStyle hint: {style_hint}"

        state_delta: dict = {
            "mode": mode.value,
            "user_request": user_prompt,
        }
        if mode in (WorkflowMode.DIAGRAM, WorkflowMode.BOTH):
            try:
                state_delta["examples"] = search_local_kb(user_prompt, k=5)
            except Exception as exc:
                logger.warning("KB prefetch failed: %s", exc)
                state_delta["examples"] = []

        message = types.Content(role="user", parts=[types.Part(text=prompt)])

        # K2 Think IFM endpoint requires streaming; SSE mode enables LiteLLM stream=True.
        run_config = RunConfig(streaming_mode=StreamingMode.SSE)

        async for event in runner.run_async(
            user_id="default_user",
            session_id=session_id,
            new_message=message,
            state_delta=state_delta,
            run_config=run_config,
        ):
            step = agent_to_step(event.author or "")
            payload = {"step": step, "author": event.author, "partial": event.partial}
            if event.content and event.content.parts:
                text_parts = [p.text for p in event.content.parts if p.text]
                if text_parts:
                    payload["text"] = "\n".join(text_parts)[:500]
            self._notify(session_id, payload)

        session = await self._session_service.get_session(
            app_name=APP_NAME, user_id="default_user", session_id=session_id
        )
        state = dict(session.state) if session else {}

        # Deterministic TikZ compile check (K2 API does not support tool calls).
        code = state.get("tikz_code")
        if code and isinstance(code, str):
            try:
                import json

                report = json.loads(compile_tikz_tool(code))
                state["tikz_validation_report"] = report
            except Exception as exc:
                logger.warning("TikZ compile check failed: %s", exc)

        return session_id, state_to_final_answer(state).model_dump()

    def subscribe(self, session_id: str, callback: Callable[[dict], None]) -> None:
        self._event_subscribers.setdefault(session_id, []).append(callback)

    def unsubscribe(self, session_id: str, callback: Callable[[dict], None]) -> None:
        subs = self._event_subscribers.get(session_id, [])
        if callback in subs:
            subs.remove(callback)

    def _notify(self, session_id: str, payload: dict) -> None:
        self._event_history.setdefault(session_id, []).append(payload)
        for cb in self._event_subscribers.get(session_id, []):
            try:
                cb(payload)
            except Exception as exc:
                logger.warning("Event subscriber error: %s", exc)

    def get_history(self, session_id: str) -> list[dict]:
        return list(self._event_history.get(session_id, []))

    async def stream_events(self, session_id: str) -> AsyncGenerator[dict, None]:
        queue: asyncio.Queue[Optional[dict]] = asyncio.Queue()

        def _cb(payload: dict) -> None:
            queue.put_nowait(payload)

        self.subscribe(session_id, _cb)
        try:
            while True:
                item = await queue.get()
                if item is None:
                    break
                yield item
        finally:
            self.unsubscribe(session_id, _cb)


workflow_runner = WorkflowRunner()
