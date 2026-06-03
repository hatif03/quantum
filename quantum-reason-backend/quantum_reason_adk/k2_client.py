"""OpenAI-compatible client for K2 Think v2 (streaming required)."""

import os
from collections.abc import AsyncIterator, Awaitable, Callable
from typing import Any, Optional

from dotenv import load_dotenv
from openai import AsyncOpenAI

load_dotenv()

K2_API_BASE = os.getenv("K2_API_BASE", "https://api.k2think.ai/v1")
K2_API_KEY = os.getenv("K2_THINK_API_KEY", "")
K2_THINK_MODEL_ID = os.getenv("K2_THINK_MODEL", "MBZUAI-IFM/K2-Think-v2")

_client: Optional[AsyncOpenAI] = None

StreamEventCallback = Callable[[dict[str, Any]], Awaitable[None] | None]


def get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        if not K2_API_KEY:
            raise RuntimeError("K2_THINK_API_KEY not set")
        _client = AsyncOpenAI(api_key=K2_API_KEY, base_url=K2_API_BASE)
    return _client


async def _emit(on_event: Optional[StreamEventCallback], payload: dict[str, Any]) -> None:
    if on_event is None:
        return
    result = on_event(payload)
    if result is not None:
        await result


async def stream_chat_events(
    *,
    system: str,
    user: str,
    model: Optional[str] = None,
    phase: str = "default",
    on_event: Optional[StreamEventCallback] = None,
) -> str:
    """Stream a chat completion; emit thinking deltas; return full text."""
    client = get_client()
    model_id = model or K2_THINK_MODEL_ID
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": user})

    stream = await client.chat.completions.create(
        model=model_id,
        messages=messages,
        stream=True,
    )

    parts: list[str] = []
    async for chunk in stream:
        if not chunk.choices:
            continue
        delta = chunk.choices[0].delta.content
        if delta:
            parts.append(delta)
            await _emit(
                on_event,
                {"type": "thinking", "phase": phase, "delta": delta},
            )

    full = "".join(parts)
    await _emit(
        on_event,
        {"type": "thinking_done", "phase": phase, "chars": len(full)},
    )
    return full


async def stream_chat(
    *,
    system: str,
    user: str,
    model: Optional[str] = None,
    phase: str = "default",
    on_event: Optional[StreamEventCallback] = None,
) -> str:
    """Stream a chat completion; return the full accumulated text."""
    return await stream_chat_events(
        system=system,
        user=user,
        model=model,
        phase=phase,
        on_event=on_event,
    )


async def iter_chat_deltas(
    *,
    system: str,
    user: str,
    model: Optional[str] = None,
) -> AsyncIterator[str]:
    """Yield content deltas only (no callback)."""
    client = get_client()
    model_id = model or K2_THINK_MODEL_ID
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": user})

    stream = await client.chat.completions.create(
        model=model_id,
        messages=messages,
        stream=True,
    )

    async for chunk in stream:
        if not chunk.choices:
            continue
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta
