#!/bin/sh
# Fail the image build if lualatex, tikz-feynman, pdftoppm, or pdfcrop are unavailable.
set -e

command -v lualatex >/dev/null 2>&1 || {
  echo "lualatex not found (install texlive-luatex)"
  exit 1
}

command -v pdfcrop >/dev/null 2>&1 || {
  echo "pdfcrop not found (install texlive-extra-utils)"
  exit 1
}

cat > /tmp/diag.tex <<'EOF'
\documentclass[border=2pt]{standalone}
\usepackage{xcolor}
\usepackage{tikz}
\usepackage{tikz-feynman}
\usepackage{amsmath}
\usepackage{amssymb}
\usepackage{physics}
\usetikzlibrary{arrows.meta}
\begin{document}
\begin{tikzpicture}
\feynmandiagram [horizontal=a to b] {
  i1 [particle=\(\gamma\)] -- [photon] v1,
  i2 [particle=\(e^-\)] -- [fermion] v1,
  v1 -- [fermion] o1 [particle=\(e^-\)],
  v1 -- [photon] o2 [particle=\(\gamma'\)]
};
\end{tikzpicture}
\end{document}
EOF

lualatex -interaction=nonstopmode -output-directory /tmp /tmp/diag.tex > /tmp/diag-lualatex.log 2>&1 || {
  echo "lualatex failed:"
  tail -80 /tmp/diag-lualatex.log
  exit 1
}

test -f /tmp/diag.pdf || { echo "PDF not generated"; exit 1; }

if grep -q "requires LuaTeX" /tmp/diag-lualatex.log; then
  echo "tikz-feynman horizontal layout still requires LuaTeX — check texlive-luatex"
  grep "requires LuaTeX" /tmp/diag-lualatex.log | head -5
  exit 1
fi

pdfcrop --margins 12 /tmp/diag.pdf /tmp/diag-crop.pdf > /tmp/diag-pdfcrop.log 2>&1 || {
  echo "pdfcrop failed:"
  tail -40 /tmp/diag-pdfcrop.log
  exit 1
}

test -f /tmp/diag-crop.pdf || { echo "Cropped PDF not generated"; exit 1; }

pdftoppm -png -singlefile -r 150 /tmp/diag-crop.pdf /tmp/diag
test -f /tmp/diag.png || { echo "PNG not generated"; exit 1; }

echo "TeX toolchain OK (lualatex + tikz-feynman horizontal layout + pdfcrop + pdftoppm)"
