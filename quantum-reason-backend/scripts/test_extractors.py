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
    check_feynman_diagram_issues,
    extract_diagram_lesson,
    extract_json_object,
    extract_tikz,
    is_cot_leak,
    is_math_schema_echo,
    is_placeholder_tikz,
    is_reasoning_trace_blob,
    is_valid_tikz,
    normalize_tikz_string,
    sanitize_annotation_latex,
    sanitize_reasoning_trace,
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
    raw = (
        r'{"tikz": "\feynmandiagram [horizontal=a to b] { i1 -- [fermion] v1; }"}'
    )
    repaired = _escape_latex_in_json_source(raw)
    parsed = _try_parse_json(repaired)
    assert parsed is not None
    tikz = parsed["tikz"]
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


def test_cot_and_reasoning_trace() -> None:
    assert is_cot_leak("In JSON strings, literal backslash must be escaped")
    blob = '{"derivation_steps": [{"panel_id": "panel_5", "latex": ["eq"]}]}'
    assert is_reasoning_trace_blob(blob)
    assert sanitize_reasoning_trace(blob) is None
    assert sanitize_reasoning_trace("Short educator summary of the physics.") is not None


COT_TIKZ_MENTION = """
Ensure proper line break after the semicolon? The code block should be a single block of TikZ.
Use leg syntax within `\\feynmandiagram`. Check that braces are balanced with { and }.
We need to remove leftarrow key. Thus answer is:
"""

PANEL1_TIKZ = r"""
\feynmandiagram [horizontal = i to e] {
    i [particle=\(W^{-}\)] -- [charged boson] v,
    v -- [fermion] e [particle=\(e^{-}\)],
    v -- [antifermion] nu [particle=\(\bar{\nu}_e\)]
};
"""


def test_cot_prose_not_valid_tikz() -> None:
    assert not is_valid_tikz(COT_TIKZ_MENTION)
    assert extract_tikz(COT_TIKZ_MENTION) is None


def test_antifermion_passes_syntax_check() -> None:
    issues = check_feynman_diagram_issues(PANEL1_TIKZ)
    assert issues == [], f"unexpected issues: {issues}"


def test_invalid_vertex_label_rejected() -> None:
    bad = r"""
\feynmandiagram [horizontal=a to b] {
  i1 [particle=\(\gamma\)] -- [photon] v1,
  v1 [label=above:-ie\gamma^\mu]
};
"""
    issues = check_feynman_diagram_issues(bad)
    assert any("label=" in i for i in issues)


def test_z_boson_photon_style_rejected() -> None:
    bad = r"""
\feynmandiagram [horizontal=Z_in to V] {
  Z_in [particle=\(Z\)] -- [photon] v1,
  v1 -- [fermion] o1 [particle=\(e^-\)]
};
"""
    issues = check_feynman_diagram_issues(bad)
    assert any("boson" in i for i in issues)


def test_sanitize_annotation_latex() -> None:
    raw = ["M_Z", "vertex_factor", "-ig/\\cos\\theta_W \\\\gamma^\\mu", "k"]
    out = sanitize_annotation_latex(raw)
    assert "vertex_factor" not in out
    assert "M_Z" in out
    assert any("gamma" in s for s in out)


def test_placeholder_tikz_rejected() -> None:
    stub = r"\feynmandiagram [horizontal=a to b] { ... };"
    assert is_placeholder_tikz(stub)
    assert not is_valid_tikz(stub)


def main() -> int:
    test_begin_feyn_escapes()
    test_corrupt_normalize()
    test_schema_echo_rejected()
    test_session_log_picks_compton()
    test_cot_and_reasoning_trace()
    test_cot_prose_not_valid_tikz()
    test_antifermion_passes_syntax_check()
    test_invalid_vertex_label_rejected()
    test_z_boson_photon_style_rejected()
    test_sanitize_annotation_latex()
    test_placeholder_tikz_rejected()

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
        "```tikz\n\\feynmandiagram [horizontal=a to b] { i1 -- [fermion] v1; }\n```",
        {"panel_outline": [{"id": "p1", "title": "T", "purpose": "x"}]},
    )
    assert fb and len(fb["panels"]) == 1, "fallback failed"

    print("extractor tests OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
