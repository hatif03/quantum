"""OpenAI-compatible client for K2 Think v2 (streaming required)."""

import os
from typing import Optional

from dotenv import load_dotenv
from openai import AsyncOpenAI

load_dotenv()

K2_API_BASE = os.getenv("K2_API_BASE", "https://api.k2think.ai/v1")
K2_API_KEY = os.getenv("K2_THINK_API_KEY", "")
K2_THINK_MODEL_ID = os.getenv("K2_THINK_MODEL", "MBZUAI-IFM/K2-Think-v2")

_client: Optional[AsyncOpenAI] = None


def get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        if not K2_API_KEY:
            raise RuntimeError("K2_THINK_API_KEY not set")
        _client = AsyncOpenAI(api_key=K2_API_KEY, base_url=K2_API_BASE)
    return _client


async def stream_chat(*, system: str, user: str, model: Optional[str] = None) -> str:
    """Stream a chat completion; return the full accumulated text."""
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
    return "".join(parts)
