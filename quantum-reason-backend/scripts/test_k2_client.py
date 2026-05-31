"""Compare OpenAI SDK streaming against the K2 Think API."""

import asyncio
import os
import sys
import time
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
load_dotenv(ROOT / ".env")

PROMPT = "In one sentence, what is a Feynman diagram?"
MODEL = os.getenv("K2_THINK_MODEL", "MBZUAI-IFM/K2-Think-v2")
BASE_URL = os.getenv("K2_API_BASE", "https://api.k2think.ai/v1")
API_KEY = os.getenv("K2_THINK_API_KEY", "")


async def test_openai_sdk() -> dict:
    from openai import AsyncOpenAI

    client = AsyncOpenAI(api_key=API_KEY, base_url=BASE_URL)
    start = time.perf_counter()
    chunks: list[str] = []
    stream = await client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": PROMPT}],
        stream=True,
    )
    async for chunk in stream:
        delta = chunk.choices[0].delta.content if chunk.choices else None
        if delta:
            chunks.append(delta)
    elapsed = time.perf_counter() - start
    text = "".join(chunks).strip()
    return {"ok": bool(text), "latency_s": round(elapsed, 2), "chars": len(text)}


async def main() -> int:
    if not API_KEY:
        print("ERROR: K2_THINK_API_KEY not set")
        return 1

    try:
        result = await test_openai_sdk()
        status = "OK" if result["ok"] else "FAIL"
        print(f"openai: {status} ({result['latency_s']}s, {result['chars']} chars)")
        return 0 if result["ok"] else 1
    except Exception as exc:
        print(f"openai: FAIL — {exc}")
        return 1


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
