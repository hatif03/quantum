"""Parse model text into structured workflow state fields."""

import json
import logging
import re
from typing import Any, Callable, Optional

logger = logging.getLogger(__name__)

_COT_LEAK_MARKERS = (
    "human-readable process name",
    "output only valid json",
    "output only the json",
    "matching this schema",
    "lesson planner for quantum reason",
    "we need to answer as the",
    "diagram lesson generator",
    "math explainer for quantum",
    "put your final answer only",
    '{"id": "panel_1", "title": "short title"',
    '"purpose": "what this panel should visualize"',
    "json strings",
    "escape sequence",
    "double backslash",
    "literal backslash",
    "valid json",
    "json.loads",
    "must be escaped",
)

_REASONING_TRACE_JSON_MARKERS = (
    '"derivation_steps"',
    '"panel_id"',
    '"key_equations"',
    '"common_mistake"',
)

_MATH_SCHEMA_MARKERS = (
    "short title",
    "concepts the reader should know",
    "latex for central equations",
    "step name",
    "accessible explanation",
    "what this means physically",
    "how panels and feynman rules connect to the algebra",
    "substantive educator-facing summary of your reasoning chain",
    "optional pitfall students make",
    "why this step is true",
)

_TRAILING_COMMA_RE = re.compile(r",\s*([}\]])")

# Corrupted tikz when JSON ate \b \f escapes
_CORRUPT_TIKZ_RE = re.compile(
    r"^begintikzpicture|^beginfeynman|^egin\{tikz",
    re.IGNORECASE,
)

_PANEL_ID_COMMENT_RE = re.compile(
    r"<!--\s*(panel[_\s-]*\d+|panel_\w+)\s*-->",
    re.IGNORECASE,
)


def is_cot_leak(text: str) -> bool:
    if not text or len(text.strip()) < 20:
        return False
    lower = text.lower()
    hits = sum(1 for m in _COT_LEAK_MARKERS if m in lower)
    if hits >= 2:
        return True
    if hits >= 1 and ("schema" in lower or "lesson planner" in lower):
        return True
    if lower.startswith("we need to answer") or lower.startswith("let me"):
        return True
    if len(text) > 2000 and ("```json" in lower or '"derivation_steps"' in lower):
        return True
    return False


def is_reasoning_trace_blob(text: str) -> bool:
    """True if reasoning_trace looks like embedded JSON, not educator prose."""
    if not text or len(text.strip()) < 40:
        return False
    lower = text.lower()
    if sum(1 for m in _REASONING_TRACE_JSON_MARKERS if m in lower) >= 2:
        return True
    if '"derivation_steps"' in lower or ('"panel_id"' in lower and '"latex"' in lower):
        return True
    if text.count("{") >= 4 and text.count('"') >= 12:
        return True
    if is_cot_leak(text):
        return True
    return False


def sanitize_reasoning_trace(raw: Any, *, max_len: int = 800) -> Optional[str]:
    if raw is None:
        return None
    text = str(raw).strip()
    if not text or is_reasoning_trace_blob(text):
        return None
    if len(text) > max_len:
        return text[:max_len].rstrip() + "…"
    return text


def _escape_latex_in_json_source(blob: str) -> str:
    """
    Fix invalid JSON escapes from LaTeX (\\begin, \\feyn, etc.).
    Only preserve true JSON escapes: \\", \\\\, \\/, \\uXXXX.
    """
    out: list[str] = []
    i = 0
    n = len(blob)
    while i < n:
        ch = blob[i]
        if ch != "\\" or i + 1 >= n:
            out.append(ch)
            i += 1
            continue
        nxt = blob[i + 1]
        if nxt == "u" and i + 5 < n:
            hex_part = blob[i + 2 : i + 6]
            if all(c in "0123456789abcdefABCDEF" for c in hex_part):
                out.append(blob[i : i + 6])
                i += 6
                continue
        if nxt in '"\\/':
            out.append(blob[i : i + 2])
            i += 2
            continue
        # LaTeX command — double the backslash
        out.append("\\\\")
        out.append(nxt)
        i += 2
    return "".join(out)


def _repair_json(candidate: str) -> str:
    text = _TRAILING_COMMA_RE.sub(r"\1", candidate)
    return _escape_latex_in_json_source(text)


def _try_parse_json(candidate: str) -> Optional[dict[str, Any]]:
    candidate = candidate.strip()
    if not candidate:
        return None
    for attempt in (candidate, _repair_json(candidate)):
        try:
            value = json.loads(attempt)
        except json.JSONDecodeError:
            continue
        if isinstance(value, dict):
            return value
    return None


def normalize_tikz_string(tikz: str) -> str:
    """Recover common corruption after json.loads ate backslashes."""
    if not tikz:
        return ""
    s = tikz.strip()
    if "\\feynmandiagram" in s or "\\begin{tikzpicture}" in s or "\\begin{feynman}" in s:
        return s
    if _CORRUPT_TIKZ_RE.search(s):
        s = re.sub(r"^begintikzpicture", r"\\begin{tikzpicture}", s, flags=re.I)
        s = re.sub(r"beginfeynman", r"\\begin{feynman}", s, flags=re.I)
        s = re.sub(r"\\begin\{feynman\}", r"\\begin{feynman}", s, flags=re.I)
        if "feynmandiagram" in s and "\\feynmandiagram" not in s:
            s = s.replace("feynmandiagram", r"\feynmandiagram", 1)
    return s


def _skip_balanced(s: str, start: int, open_c: str, close_c: str) -> int:
    """Return index of the matching close character, or -1."""
    if start >= len(s) or s[start] != open_c:
        return -1
    depth = 0
    for i in range(start, len(s)):
        if s[i] == open_c:
            depth += 1
        elif s[i] == close_c:
            depth -= 1
            if depth == 0:
                return i
    return -1


def extract_feynmandiagram_block(text: str, idx: int = 0) -> str:
    """Extract one \\feynmandiagram[...]{...}; block starting at idx."""
    if idx < 0 or idx >= len(text):
        return ""
    sub = text[idx:].lstrip()
    if not sub.startswith("\\feynmandiagram"):
        return ""
    pos = len("\\feynmandiagram")
    rest = sub[pos:].lstrip()
    if rest.startswith("["):
        bracket_end = _skip_balanced(rest, 0, "[", "]")
        if bracket_end < 0:
            return ""
        rest = rest[bracket_end + 1 :].lstrip()
    if not rest.startswith("{"):
        return ""
    brace_end = _skip_balanced(rest, 0, "{", "}")
    if brace_end < 0:
        return ""
    prefix_len = len(sub) - len(rest)
    block = sub[: prefix_len + brace_end + 1]
    tail = rest[brace_end + 1 :].lstrip()
    if tail.startswith(";"):
        block += ";"
    return normalize_tikz_string(block)


_FEYNMAN_LEG_RE = re.compile(
    r"--\s*\[(?:"
    r"fermion|anti[\s_-]*fermion|antifermion|"
    r"photon|boson|charged[\s_-]*boson|gluon|scalar|ghost"
    r")",
    re.IGNORECASE,
)


def is_placeholder_tikz(tikz: str) -> bool:
    """True for schema stubs like { ... } without real leg syntax."""
    s = normalize_tikz_string(tikz)
    if not s:
        return True
    if re.search(r"\{\s*\.\.\.\s*\}", s):
        return True
    if "\\feynmandiagram" in s:
        idx = s.find("\\feynmandiagram")
        block = extract_feynmandiagram_block(s, idx)
        if block and not _FEYNMAN_LEG_RE.search(block):
            return True
    return False


def is_valid_tikz(tikz: str) -> bool:
    """Heuristic: must look like real TikZ-Feynman, not corrupted JSON debris."""
    s = normalize_tikz_string(tikz)
    if not s or len(s) < 12:
        return False
    if is_cot_leak(s):
        return False
    if _CORRUPT_TIKZ_RE.search(s.split("\n")[0][:80]):
        return False
    if is_placeholder_tikz(s):
        return False
    if "\\feynmandiagram" in s:
        idx = s.find("\\feynmandiagram")
        block = extract_feynmandiagram_block(s, idx)
        if (
            block
            and len(block) >= 20
            and len(s.strip()) <= len(block) + 32
        ):
            return True
    return "\\begin{tikzpicture}" in s or "\\begin{feynman}" in s


def is_feynman_tikz(tikz: str) -> bool:
    """Stricter check for teach panels: require tikz-feynman macro."""
    s = normalize_tikz_string(tikz)
    if not s or len(s) < 12:
        return False
    if _CORRUPT_TIKZ_RE.search(s.split("\n")[0][:80]):
        return False
    if is_placeholder_tikz(s):
        return False
    return "\\feynmandiagram" in s


def tikz_passes_teach_precheck(tikz_code: str) -> tuple[bool, str]:
    """Teach panels must use feynmandiagram, not manual draw-only tikzpicture."""
    normalized = normalize_tikz_string(tikz_code or "")
    if not normalized:
        return False, ""
    if not is_feynman_tikz(normalized):
        return False, normalized
    return True, normalized


_ANNOTATION_PLACEHOLDERS = frozenset(
    {
        "vertex_factor",
        "short title",
        "step name",
        "topic",
        "latex for central equations",
    }
)


def sanitize_annotation_latex(items: Any) -> list[str]:
    """Drop schema placeholders and snake_case keys mistaken for LaTeX."""
    if not isinstance(items, list):
        return []
    out: list[str] = []
    for raw in items:
        s = str(raw or "").strip()
        if not s:
            continue
        lower = s.lower()
        if lower in _ANNOTATION_PLACEHOLDERS:
            continue
        if re.match(r"^[a-z][a-z0-9_]*$", s) and "_" in s and "\\" not in s:
            continue
        out.append(s)
    return out


def check_feynman_diagram_issues(tikz: str) -> list[str]:
    """Static checks for common K2 mistakes before calling pdflatex."""
    s = normalize_tikz_string(tikz)
    if not s or "\\feynmandiagram" not in s:
        return []

    issues: list[str] = []
    if re.search(r"\\vertex\b", s):
        issues.append(
            "Do not use \\vertex inside \\feynmandiagram. "
            "Use legs: i1 [particle=\\(e^-\\)] -- [fermion] v1"
        )
    if re.search(r"\\draw\b", s):
        issues.append(
            "Do not use \\draw inside \\feynmandiagram. "
            "Connect particles with -- [fermion] or -- [photon]"
        )
    if re.search(r"\\node\b", s):
        issues.append(
            "Do not use \\node inside \\feynmandiagram. "
            "Put labels in [particle=\\(...\\)] on external legs"
        )
    if re.search(r"(?:^|[,\s])(?:v\d+|[a-z]\d*)\s*\[label\s*=", s, re.IGNORECASE):
        issues.append(
            "Do not use v1 [label=...] vertex annotations inside \\feynmandiagram. "
            "Put factors and angles in annotation_latex / caption instead"
        )
    if re.search(r"--\s*\[[^\]]*\blabel\s*=", s, re.IGNORECASE):
        issues.append(
            "Do not put label= on leg styles (-- [fermion, label=...]). "
            "Use [particle=\\(...\\)] on external legs only"
        )
    if re.search(r"--\s*\[[^\]]*\bmomentum\s*=", s, re.IGNORECASE):
        issues.append(
            "Do not use momentum= on legs inside \\feynmandiagram. "
            "Put momenta in annotation_latex (e.g. k, p) instead"
        )
    if re.search(r"horizontal\s*=\s*[^\]\n]*_", s, re.IGNORECASE):
        issues.append(
            "Use simple layout names in horizontal= (e.g. horizontal=a to b), "
            "not Z_in, eMinus, or other underscore ids"
        )
    if re.search(
        r"particle\s*=\s*\\?\(\\?Z[\^\\]?[\{\+\-0-9\\}]*\\?\).*--\s*\[photon\]",
        s,
        re.IGNORECASE,
    ) or re.search(
        r"particle\s*=\s*\\?\(\\?W[\^\\]?[\{\+\-0-9\\}]*\\?\).*--\s*\[photon\]",
        s,
        re.IGNORECASE,
    ):
        issues.append(
            "Z and W boson propagators use -- [boson], not -- [photon]"
        )
    if re.search(r"bend\s+(?:left|right)\s*=\s*(?:[6-9]\d|\d{3,})", s, re.IGNORECASE):
        issues.append(
            "Keep bend left/right angles at most 45 to avoid clipped diagram legs"
        )
    if not re.search(
        r"--\s*\[(?:"
        r"fermion|anti[\s_-]*fermion|antifermion|"
        r"photon|boson|charged[\s_-]*boson|gluon|scalar|ghost"
        r")",
        s,
        re.IGNORECASE,
    ):
        issues.append(
            "Missing leg syntax. Example: i1 [particle=\\(\\gamma\\)] -- [photon] v1"
        )
    idx = s.find("\\feynmandiagram")
    block = extract_feynmandiagram_block(s, idx) if idx >= 0 else s
    if block and block.count("{") != block.count("}"):
        issues.append(
            f"Unmatched braces in TikZ ({block.count('{')} open, {block.count('}')} close)"
        )
    return issues


def extract_panel_tikz_from_lesson(lesson_text: str, panel_id: str) -> str:
    """Return the best TikZ block for a panel id from raw lesson response text."""
    if not lesson_text:
        return ""
    pid = str(panel_id or "").lower().replace("-", "_")
    by_id = _extract_tikz_blocks_by_panel(lesson_text)
    for key in (pid, pid.replace("panel_", "panel"), f"panel_{pid.lstrip('panel_')}"):
        if key in by_id:
            return by_id[key]
    blocks = _extract_all_tikz_blocks(lesson_text)
    if len(blocks) == 1:
        return blocks[0]
    return ""


def _panel_tikz(panel: dict[str, Any]) -> str:
    for key in ("tikz", "tikz_code", "tikzCode", "code", "snippet"):
        val = panel.get(key)
        if val and str(val).strip():
            return normalize_tikz_string(str(val).strip())
    return ""


def _validate_lesson_plan(data: dict[str, Any]) -> bool:
    outline = data.get("panel_outline") or data.get("panelOutline")
    if not isinstance(outline, list) or len(outline) == 0:
        return False
    for item in outline:
        if not isinstance(item, dict):
            return False
        if not (item.get("id") or item.get("title")):
            return False
    name = data.get("process_name") or data.get("processName") or ""
    if isinstance(name, str) and is_cot_leak(str(name)):
        return False
    return True


def _validate_diagram_lesson_strict(data: dict[str, Any]) -> bool:
    panels = data.get("panels")
    if not isinstance(panels, list) or len(panels) == 0:
        return False
    has_tikz = False
    for item in panels:
        if not isinstance(item, dict):
            return False
        tikz = _panel_tikz(item)
        if tikz and is_valid_tikz(tikz):
            has_tikz = True
    return has_tikz


def _validate_diagram_lesson_relaxed(data: dict[str, Any]) -> bool:
    panels = data.get("panels")
    return isinstance(panels, list) and len(panels) > 0


def _validate_math_explanation_strict(data: dict[str, Any]) -> bool:
    topic = data.get("topic") or ""
    if not topic or not str(topic).strip():
        return False
    if is_cot_leak(str(topic)):
        return False
    if is_math_schema_echo(data):
        return False
    steps = data.get("derivation_steps") or data.get("derivationSteps") or []
    if not isinstance(steps, list) or len(steps) == 0:
        return False
    return True


def _validate_math_explanation_relaxed(data: dict[str, Any]) -> bool:
    topic = data.get("topic") or ""
    if not topic or not str(topic).strip():
        return False
    if is_cot_leak(str(topic)):
        return False
    if is_math_schema_echo(data):
        return False
    steps = data.get("derivation_steps") or data.get("derivationSteps") or []
    equations = data.get("key_equations") or data.get("keyEquations") or []
    return bool(steps) or bool(equations)


def is_math_schema_echo(data: dict[str, Any]) -> bool:
    """True when K2 echoed the math explainer prompt template instead of real content."""
    if not data:
        return True
    topic = str(data.get("topic") or "").strip().lower()
    if topic in ("short title", "topic"):
        return True

    blob = json.dumps(data, default=str).lower()
    if sum(1 for m in _MATH_SCHEMA_MARKERS if m in blob) >= 2:
        return True

    for prereq in data.get("prerequisites") or []:
        if "concepts the reader should know" in str(prereq).lower():
            return True

    for eq in data.get("key_equations") or data.get("keyEquations") or []:
        s = str(eq).strip().lower()
        if "latex for central equations" in s or s in ("eq1", "eq2"):
            return True

    for step in data.get("derivation_steps") or data.get("derivationSteps") or []:
        if not isinstance(step, dict):
            continue
        if str(step.get("title") or "").strip().lower() == "step name":
            return True
        for latex in step.get("latex") or []:
            if str(latex).strip().lower() in ("eq1", "eq2"):
                return True
        if str(step.get("prose") or "").strip().lower() == "accessible explanation":
            return True

    return False


def _math_explanation_quality_score(data: dict[str, Any]) -> int:
    if is_math_schema_echo(data):
        return -1000
    score = 0
    topic = str(data.get("topic") or "").strip()
    if topic and topic.lower() not in ("short title", "topic"):
        score += min(len(topic), 80)
    steps = data.get("derivation_steps") or data.get("derivationSteps") or []
    score += 10 * sum(1 for s in steps if isinstance(s, dict))
    for eq in data.get("key_equations") or data.get("keyEquations") or []:
        if "\\" in str(eq) or "$" in str(eq):
            score += 8
    interp = str(
        data.get("physical_interpretation") or data.get("physicalInterpretation") or ""
    )
    if len(interp) > 80:
        score += 10
    return score


def _pick_math_explanation(
    candidates: list[dict[str, Any]],
    *,
    validator: Callable[[dict[str, Any]], bool],
) -> Optional[dict[str, Any]]:
    """Pick best non-template math JSON (never prefer schema echo over real content)."""
    scored: list[tuple[int, int, dict[str, Any]]] = []
    for idx, candidate in enumerate(candidates):
        if not validator(candidate) or is_math_schema_echo(candidate):
            continue
        scored.append((_math_explanation_quality_score(candidate), idx, candidate))
    if not scored:
        return None
    scored.sort(key=lambda item: (-item[0], -item[1]))
    return scored[0][2]


def _extract_fenced_json_blocks(text: str) -> list[str]:
    if not text:
        return []
    stripped = text.strip()
    patterns = [
        r"```json\s*\n(.*?)```",
        r"```JSON\s*\n(.*?)```",
        r"```\s*\n(\{[\s\S]*?\})\s*```",
    ]
    blocks: list[str] = []
    for pattern in patterns:
        for match in re.finditer(pattern, stripped, re.DOTALL | re.IGNORECASE):
            blocks.append(match.group(1).strip())
    return blocks


def _extract_brace_objects_from_end(text: str) -> list[dict[str, Any]]:
    if not text:
        return []
    stripped = text.strip()
    results: list[dict[str, Any]] = []
    positions = [m.start() for m in re.finditer(r"\{", stripped)]
    for start in reversed(positions):
        depth = 0
        for idx in range(start, len(stripped)):
            char = stripped[idx]
            if char == "{":
                depth += 1
            elif char == "}":
                depth -= 1
                if depth == 0:
                    blob = stripped[start : idx + 1]
                    if (
                        "human-readable process name" in blob
                        and "panel_outline" in blob
                        and len(blob) < 800
                    ):
                        continue
                    parsed = _try_parse_json(blob)
                    if parsed:
                        results.append(parsed)
                    break
    return results


def _extract_json_candidates(text: str) -> list[dict[str, Any]]:
    if not text:
        return []
    seen: list[str] = []
    candidates: list[dict[str, Any]] = []

    def add(parsed: dict[str, Any]) -> None:
        key = json.dumps(parsed, sort_keys=True, default=str)
        if key not in seen:
            seen.append(key)
            candidates.append(parsed)

    for raw_block in _extract_fenced_json_blocks(text):
        parsed = _try_parse_json(raw_block)
        if parsed:
            add(parsed)

    for parsed in _extract_brace_objects_from_end(text):
        add(parsed)

    return candidates


def _pick_candidate(
    candidates: list[dict[str, Any]],
    *,
    validator: Callable[[dict[str, Any]], bool],
    prefer_keys: Optional[tuple[str, ...]] = None,
) -> Optional[dict[str, Any]]:
    valid = [c for c in candidates if validator(c)]
    if not valid:
        return None

    if prefer_keys:
        for key in prefer_keys:
            for parsed in reversed(valid):
                if key in parsed:
                    return parsed

    return valid[-1]


def _extract_tikz_blocks_by_panel(text: str) -> dict[str, str]:
    """
    Map panel_id -> tikz from fenced blocks.
    Supports: <!-- panel_1 --> before ```tikz, or panel_1: before fence.
    """
    by_id: dict[str, str] = {}
    if not text:
        return by_id

    pattern = re.compile(
        r"(?:<!--\s*(panel[_\s-]*\d+|panel_\w+)\s*-->|(?:^|\n)\s*(panel[_\s-]*\d+)\s*:)\s*"
        r"```(?:tikz|latex)?\s*\n(.*?)```",
        re.DOTALL | re.IGNORECASE,
    )
    for match in pattern.finditer(text):
        pid = match.group(1) or match.group(2)
        if pid:
            pid = pid.strip().lower().replace(" ", "_").replace("-", "_")
            if not pid.startswith("panel"):
                pid = f"panel_{pid}"
            code = normalize_tikz_string(match.group(3).strip())
            if code and is_valid_tikz(code):
                by_id[pid] = code

    # Ordered list without ids — fill panel_1, panel_2, ...
    orphan_blocks = []
    for block in re.findall(
        r"```(?:tikz|latex)?\s*\n(.*?)```", text, re.DOTALL | re.IGNORECASE
    ):
        code = normalize_tikz_string(block.strip())
        if code and is_valid_tikz(code):
            orphan_blocks.append(code)

    used = set(by_id.values())
    idx = 0
    for code in orphan_blocks:
        if code in used:
            continue
        while f"panel_{idx + 1}" in by_id:
            idx += 1
        by_id[f"panel_{idx + 1}"] = code
        idx += 1

    return by_id


def _extract_all_tikz_blocks(text: str) -> list[str]:
    blocks = re.findall(
        r"```(?:tikz|latex)?\s*\n(.*?)```", text, re.DOTALL | re.IGNORECASE
    )
    results = []
    for b in blocks:
        code = normalize_tikz_string(b.strip())
        if code and is_valid_tikz(code):
            results.append(code)
    if results:
        return results
    one = extract_tikz(text)
    return [one] if one else []


def _enrich_diagram_lesson_panels(
    lesson: dict[str, Any], full_text: str
) -> dict[str, Any]:
    panels = lesson.get("panels") or []
    if not isinstance(panels, list):
        return lesson

    by_id = _extract_tikz_blocks_by_panel(full_text)
    tikz_blocks = _extract_all_tikz_blocks(full_text)
    used_blocks: set[str] = set()
    enriched = []
    for idx, raw in enumerate(panels):
        if not isinstance(raw, dict):
            continue
        panel = dict(raw)
        pid = str(panel.get("id") or f"panel_{idx + 1}").lower()
        tikz = _panel_tikz(panel)
        if not tikz or not is_valid_tikz(tikz):
            tikz = by_id.get(pid) or by_id.get(f"panel_{idx + 1}")
            if not tikz and idx < len(tikz_blocks):
                candidate = tikz_blocks[idx]
                if candidate not in used_blocks:
                    tikz = candidate
            if not tikz and len(panels) == 1:
                single = extract_tikz(full_text)
                if single:
                    tikz = single
        if tikz:
            panel["tikz"] = tikz
            used_blocks.add(tikz)
        ann = panel.get("annotation_latex") or panel.get("annotationLatex") or []
        panel["annotation_latex"] = sanitize_annotation_latex(ann)
        enriched.append(panel)
    lesson = dict(lesson)
    lesson["panels"] = enriched
    return lesson


def build_diagram_lesson_fallback(
    lesson_text: str,
    plan: Optional[dict[str, Any]],
) -> Optional[dict[str, Any]]:
    by_id = _extract_tikz_blocks_by_panel(lesson_text)
    tikz_blocks = list(by_id.values()) if by_id else _extract_all_tikz_blocks(lesson_text)
    if not tikz_blocks:
        return None

    outline = []
    if plan:
        outline = plan.get("panel_outline") or plan.get("panelOutline") or []

    panels: list[dict[str, Any]] = []
    if outline:
        for idx, item in enumerate(outline):
            if not isinstance(item, dict):
                continue
            pid = str(item.get("id") or f"panel_{idx + 1}").lower()
            tikz = by_id.get(pid) or tikz_blocks[min(idx, len(tikz_blocks) - 1)]
            panels.append(
                {
                    "id": item.get("id") or f"panel_{idx + 1}",
                    "title": item.get("title") or f"Step {idx + 1}",
                    "caption": item.get("purpose") or "",
                    "tikz": tikz,
                    "linked_step_index": idx,
                }
            )
    else:
        for idx, tikz in enumerate(tikz_blocks):
            panels.append(
                {
                    "id": f"panel_{idx + 1}",
                    "title": f"Diagram step {idx + 1}",
                    "caption": "",
                    "tikz": tikz,
                    "linked_step_index": idx,
                }
            )

    if not panels:
        return None

    summary = ""
    if plan:
        summary = plan.get("process_name") or plan.get("processName") or ""
    return {"summary": summary, "panels": panels}


def extract_json_object(
    text: str, *, prefer_keys: Optional[tuple[str, ...]] = None
) -> Optional[dict[str, Any]]:
    """Extract validated math JSON; reject schema template echo."""
    del prefer_keys  # kept for API compatibility

    for chunk in (text, text[-15000:] if len(text) > 15000 else ""):
        if not chunk:
            continue
        candidates = _extract_json_candidates(chunk)
        result = _pick_math_explanation(
            candidates,
            validator=_validate_math_explanation_strict,
        )
        if result:
            return result
        result = _pick_math_explanation(
            candidates,
            validator=_validate_math_explanation_relaxed,
        )
        if result:
            return result
    return None


def extract_lesson_plan(text: str) -> Optional[dict[str, Any]]:
    return _pick_candidate(
        _extract_json_candidates(text),
        validator=_validate_lesson_plan,
        prefer_keys=("panel_outline", "process_name"),
    )


def extract_diagram_lesson(text: str) -> Optional[dict[str, Any]]:
    """Merge JSON panel metadata with per-panel ```tikz``` fences."""
    candidates = _extract_json_candidates(text)
    raw = _pick_candidate(
        candidates,
        validator=_validate_diagram_lesson_strict,
        prefer_keys=("panels",),
    )
    if not raw:
        raw = _pick_candidate(
            candidates,
            validator=_validate_diagram_lesson_relaxed,
            prefer_keys=("panels",),
        )

    if raw:
        enriched = _enrich_diagram_lesson_panels(raw, text)
        if _validate_diagram_lesson_strict(enriched):
            return enriched
        # Metadata JSON ok but tikz only in fences
        if enriched.get("panels"):
            return enriched

    # Fenced tikz only + optional plan-less structure from fences
    by_id = _extract_tikz_blocks_by_panel(text)
    if by_id:
        panels = []
        for idx, (pid, tikz) in enumerate(sorted(by_id.items())):
            panels.append(
                {
                    "id": pid,
                    "title": f"Step {idx + 1}",
                    "caption": "",
                    "tikz": tikz,
                    "linked_step_index": idx,
                }
            )
        return {"summary": "", "panels": panels}

    logger.debug(
        "Diagram lesson not extracted (candidates=%d, fenced_tikz=%d)",
        len(candidates),
        len(by_id),
    )
    return None


def extract_tikz(text: str) -> Optional[str]:
    if not text:
        return None

    blocks = re.findall(
        r"```(?:tikz|latex)?\s*\n(.*?)```", text, re.DOTALL | re.IGNORECASE
    )
    for block in reversed(blocks):
        code = normalize_tikz_string(block.strip())
        if code and is_valid_tikz(code):
            return code

    for idx in reversed([m.start() for m in re.finditer(r"\\feynmandiagram", text)]):
        block = extract_feynmandiagram_block(text, idx)
        if block and is_valid_tikz(block):
            return block

    idx = text.rfind("\\begin{tikzpicture}")
    if idx >= 0:
        snippet = normalize_tikz_string(text[idx:])
        end = snippet.find("\\end{tikzpicture}")
        if end >= 0:
            snippet = snippet[: end + len("\\end{tikzpicture}")].strip()
        if snippet and is_valid_tikz(snippet):
            return snippet

    return None
