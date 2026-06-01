#!/bin/sh
# Fail the image build if pdflatex, tikz-feynman, or pdftoppm are unavailable.
set -e

cat > /tmp/diag.tex <<'EOF'
\documentclass{article}
\usepackage[margin=1cm]{geometry}
\usepackage{xcolor}
\usepackage{tikz}
\usepackage{tikz-feynman}
\usepackage{amsmath}
\usepackage{amssymb}
\usepackage{physics}
\usetikzlibrary{arrows.meta}
\begin{document}
\thispagestyle{empty}
\begin{tikzpicture}
\feynmandiagram {
  a -- [fermion] b -- [photon] c -- [fermion] d
};
\end{tikzpicture}
\end{document}
EOF

pdflatex -interaction=nonstopmode -output-directory /tmp /tmp/diag.tex > /tmp/diag-pdflatex.log 2>&1 || {
  echo "pdflatex failed:"
  tail -80 /tmp/diag-pdflatex.log
  exit 1
}

test -f /tmp/diag.pdf || { echo "PDF not generated"; exit 1; }

pdftoppm -png -singlefile -r 150 /tmp/diag.pdf /tmp/diag
test -f /tmp/diag.png || { echo "PNG not generated"; exit 1; }

echo "TeX toolchain OK (pdflatex + tikz-feynman + pdftoppm)"
