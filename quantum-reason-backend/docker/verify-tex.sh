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
\feynmandiagram [horizontal=a to b] {
  i1 [particle=\(\gamma\)] -- [photon] v1,
  i2 [particle=\(e^-\)] -- [fermion] v1,
  v1 -- [fermion] o1 [particle=\(e^-\)],
  v1 -- [photon] o2 [particle=\(\gamma'\)]
};
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

# Z boson decay: feynmandiagram must not be nested in tikzpicture
cat > /tmp/z_decay.tex <<'EOF'
\documentclass[border=2pt]{standalone}
\usepackage{xcolor}
\usepackage{tikz}
\usepackage{tikz-feynman}
\usepackage{amsmath}
\begin{document}
\feynmandiagram [horizontal=a to b] {
  i1 [particle=\(Z\)] -- [boson] v1,
  v1 -- [fermion, bend left=30] o1 [particle=\(e^-\)],
  v1 -- [anti fermion, bend right=30] o2 [particle=\(e^+\)]
};
\end{document}
EOF

lualatex -interaction=nonstopmode -output-directory /tmp /tmp/z_decay.tex > /tmp/z_decay-lualatex.log 2>&1 || {
  echo "Z decay lualatex failed:"
  tail -80 /tmp/z_decay-lualatex.log
  exit 1
}

test -f /tmp/z_decay.pdf || { echo "Z decay PDF not generated"; exit 1; }

pdfcrop --margins 12 /tmp/z_decay.pdf /tmp/z_decay-crop.pdf > /tmp/z_decay-pdfcrop.log 2>&1
pdftoppm -png -singlefile -r 150 /tmp/z_decay-crop.pdf /tmp/z_decay
test -f /tmp/z_decay.png || { echo "Z decay PNG not generated"; exit 1; }

# Reject label-only PNGs (broken layout produces tiny dimensions)
python3 - <<'PY'
import struct, sys
data = open("/tmp/z_decay.png", "rb").read()
if len(data) < 24 or data[:8] != b"\x89PNG\r\n\x1a\n":
    sys.exit("Z decay PNG invalid")
w, h = struct.unpack(">II", data[16:24])
if min(w, h) < 200:
    sys.exit(f"Z decay PNG too small ({w}x{h}) — diagram layout likely failed")
bg = (244, 240, 232)
ink = 0
for y in range(h):
    row = 26 + y * w * 4
    for x in range(w):
        i = row + x * 4
        if i + 2 >= len(data):
            continue
        px = (data[i], data[i + 1], data[i + 2])
        if any(abs(px[c] - bg[c]) > 15 for c in range(3)):
            ink += 1
ratio = ink / (w * h)
if ratio < 0.004:
    sys.exit(f"Z decay PNG lacks diagram content (ink ratio {ratio:.4f})")
PY

echo "TeX toolchain OK (lualatex + tikz-feynman horizontal layout + pdfcrop + pdftoppm + Z decay)"
