"""Parse model text into structured workflow state fields."""

import json
import re
from typing import Any, Optional


def _try_parse_json(candidate: str) -> Optional[dict[str, Any]]:
    candidate = candidate.strip()
    if not candidate:
        return None
    try:
        value = json.loads(candidate)
    except json.JSONDecodeError:
        return None
    return value if isinstance(value, dict) else None


def extract_json_object(text: str) -> Optional[dict[str, Any]]:
    """Extract the last valid JSON object from model output (K2 Think reasoning-first)."""
    if not text:
        return None

    stripped = text.strip()

    fenced = re.findall(r"```(?:json)?\s*\n(.*?)```", stripped, re.DOTALL | re.IGNORECASE)
    for block in reversed(fenced):
        parsed = _try_parse_json(block)
        if parsed:
            return parsed

    # K2 Think often ends with a bare JSON object after long reasoning.
    for match in reversed(list(re.finditer(r"\{", stripped))):
        start = match.start()
        depth = 0
        for idx in range(start, len(stripped)):
            char = stripped[idx]
            if char == "{":
                depth += 1
            elif char == "}":
                depth -= 1
                if depth == 0:
                    parsed = _try_parse_json(stripped[start : idx + 1])
                    if parsed and "topic" in parsed:
                        return parsed
                    break

    start = stripped.find("{")
    end = stripped.rfind("}")
    if start >= 0 and end > start:
        return _try_parse_json(stripped[start : end + 1])

    return None


def extract_tikz(text: str) -> Optional[str]:
    if not text:
        return None

    blocks = re.findall(r"```(?:tikz|latex)?\s*\n(.*?)```", text, re.DOTALL | re.IGNORECASE)
    if blocks:
        return blocks[-1].strip()

    for marker in ("\\feynmandiagram", "\\begin{tikzpicture}"):
        idx = text.rfind(marker)
        if idx >= 0:
            snippet = text[idx:]
            end = snippet.find("\\end{tikzpicture}")
            if end >= 0:
                return snippet[: end + len("\\end{tikzpicture}")].strip()
            return snippet.strip()

    return None
