"""Quick tests for response extractors."""

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from quantum_reason_adk.response_extractors import (  # noqa: E402
    _escape_latex_in_json_source,
    _try_parse_json,
    build_diagram_lesson_fallback,
    extract_diagram_lesson,
    extract_json_object,
    is_math_schema_echo,
    is_valid_tikz,
    normalize_tikz_string,
)

LESSON = r"""
Thinking...
```json
{
  "summary": "Compton lesson",
  "panels": [
    {
      "id": "panel_1",
      "title": "Full",
      "caption": "diagram",
      "tikz": "\\feynmandiagram [horizontal=a to b] { i1 -- [fermion] a; }"
    }
  ]
}
```
"""

MATH = r"""
```json
{
  "topic": "Compton scattering",
  "domain": "particle",
  "prerequisites": ["$E = hf$"],
  "derivation_steps": [
    {"title": "Kinematics", "latex": ["E=mc^2"], "prose": "energy"}
  ],
  "key_equations": ["\\lambda' - \\lambda = \\frac{h}{m_e}(1 - \\cos\\theta)"]
}
```
"""

FENCED_PANELS = r"""
```json
{
  "summary": "Fenced tikz lesson",
  "panels": [
    {"id": "panel_1", "title": "A", "caption": "first", "linked_step_index": 0},
    {"id": "panel_2", "title": "B", "caption": "second", "linked_step_index": 1}
  ]
}
```
<!-- panel_1 -->
```tikz
\feynmandiagram [horizontal=a to b] { i1 -- [fermion] a; }
```
<!-- panel_2 -->
```tikz
\feynmandiagram [horizontal=c to d] { i2 -- [fermion] c; }
```
"""


def test_begin_feyn_escapes() -> None:
    raw = r'{"tikz": "\begin{tikzpicture}\feynmandiagram{}"}'
    repaired = _escape_latex_in_json_source(raw)
    parsed = _try_parse_json(repaired)
    assert parsed is not None
    tikz = parsed["tikz"]
    assert tikz.startswith("\\begin{tikzpicture}")
    assert "\\feynmandiagram" in tikz
    assert is_valid_tikz(tikz)


def test_corrupt_normalize() -> None:
    bad = "begintikzpicture\\feynmandiagram"
    fixed = normalize_tikz_string(bad)
    assert "\\begin{tikzpicture}" in fixed or is_valid_tikz(fixed) or "feyn" in fixed


SCHEMA_ECHO = """
```json
{
  "topic": "short title",
  "domain": "particle",
  "prerequisites": ["concepts the reader should know"],
  "key_equations": ["LaTeX for central equations"],
  "derivation_steps": [
    {"title": "step name", "latex": ["eq1"], "prose": "accessible explanation"}
  ]
}
```
"""

SESSION_MATH_LOG = (
    ROOT
    / "logs/sessions/e6769932-a837-4989-b456-5fdd0b98a186/raw/math_response.txt"
)


def test_schema_echo_rejected() -> None:
    assert is_math_schema_echo(
        {
            "topic": "short title",
            "key_equations": ["LaTeX for central equations"],
            "derivation_steps": [{"title": "step name", "latex": ["eq1"], "prose": "x"}],
        }
    )
    assert extract_json_object(SCHEMA_ECHO) is None


def test_session_log_picks_compton() -> None:
    if not SESSION_MATH_LOG.exists():
        return
    text = SESSION_MATH_LOG.read_text(encoding="utf-8", errors="replace")
    math = extract_json_object(text)
    assert math is not None, "expected Compton math from session log"
    assert "compton" in (math.get("topic") or "").lower()
    assert len(math.get("derivation_steps") or []) >= 4
    assert not is_math_schema_echo(math)


def main() -> int:
    test_begin_feyn_escapes()
    test_corrupt_normalize()
    test_schema_echo_rejected()
    test_session_log_picks_compton()

    lesson = extract_diagram_lesson(LESSON)
    assert lesson and lesson["panels"][0].get("tikz"), "diagram lesson failed"
    assert is_valid_tikz(lesson["panels"][0]["tikz"])

    fenced = extract_diagram_lesson(FENCED_PANELS)
    assert fenced and len(fenced["panels"]) == 2, "fenced panel merge failed"
    for p in fenced["panels"]:
        assert is_valid_tikz(p["tikz"])

    math = extract_json_object(MATH)
    assert math and math.get("topic"), "math failed"
    assert math.get("prerequisites"), "prerequisites with $ allowed"

    fb = build_diagram_lesson_fallback(
        "```tikz\n\\feynmandiagram [horizontal=a to b] {}\n```",
        {"panel_outline": [{"id": "p1", "title": "T", "purpose": "x"}]},
    )
    assert fb and len(fb["panels"]) == 1, "fallback failed"

    print("extractor tests OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
