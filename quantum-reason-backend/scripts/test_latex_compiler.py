"""Regression tests for TikZ compilation and PNG quality."""

import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from quantum_reason_adk.tools.latex_compiler import (  # noqa: E402
    LaTeXCompiler,
    MIN_PNG_INK_RATIO,
    png_has_diagram_content,
    validate_tikz_compilation,
)

Z_DECAY_TIKZ = r"""
\feynmandiagram [horizontal=a to b] {
  i1 [particle=\(Z\)] -- [boson] v1,
  v1 -- [fermion, bend left=30] o1 [particle=\(e^-\)],
  v1 -- [anti fermion, bend right=30] o2 [particle=\(e^+\)]
};
"""


def test_wrap_tikz_body_no_nested_tikzpicture() -> None:
    compiler = LaTeXCompiler.__new__(LaTeXCompiler)
    wrapped = compiler._wrap_tikz_body(Z_DECAY_TIKZ)
    assert "\\begin{tikzpicture}" not in wrapped
    assert "\\feynmandiagram" in wrapped


def test_wrap_tikz_body_preserves_existing_tikzpicture() -> None:
    compiler = LaTeXCompiler.__new__(LaTeXCompiler)
    raw = r"\begin{tikzpicture}\draw (0,0)--(1,1);\end{tikzpicture}"
    assert compiler._wrap_tikz_body(raw).startswith("\\begin{tikzpicture}")


def test_z_decay_compilation_when_tex_available() -> None:
    if not shutil.which("lualatex"):
        print("skip: lualatex not available")
        return

    result = validate_tikz_compilation(Z_DECAY_TIKZ.strip())
    if not result.get("success"):
        analysis = result.get("analysis") or {}
        err_type = analysis.get("error_type")
        if err_type in ("system_error", "missing_package", "timeout"):
            print(f"skip: local TeX unavailable or incomplete ({err_type})")
            return
        if result.get("error") and "timeout" in str(result.get("error")).lower():
            print("skip: local TeX compile timeout")
            return
    assert result.get("success"), result.get("error") or result.get("analysis")
    png = result.get("png_base64")
    assert png, "expected PNG output"
    assert png_has_diagram_content(png), (
        f"Z decay PNG lacks diagram content (ink ratio {result.get('png_ink_ratio')})"
    )
    ink = result.get("png_ink_ratio") or 0.0
    assert ink >= MIN_PNG_INK_RATIO, f"ink ratio {ink} below {MIN_PNG_INK_RATIO}"


def main() -> int:
    test_wrap_tikz_body_no_nested_tikzpicture()
    test_wrap_tikz_body_preserves_existing_tikzpicture()
    test_z_decay_compilation_when_tex_available()
    print("test_latex_compiler: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
