# Quantum Reason API — FastAPI + TeX Live (lualatex) + Poppler (pdftoppm)
# for headless TikZ-Feynman diagram rendering in production.

FROM python:3.12-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# TeX packages used by quantum_reason_adk/tools/latex_compiler.py:
# geometry, xcolor, tikz, tikz-feynman, amsmath, amssymb, physics
RUN apt-get update && apt-get install -y --no-install-recommends \
    ghostscript \
    poppler-utils \
    texlive-latex-base \
    texlive-latex-recommended \
    texlive-latex-extra \
    texlive-extra-utils \
    texlive-luatex \
    texlive-pictures \
    texlive-science \
    texlive-fonts-recommended \
    && rm -rf /var/lib/apt/lists/*

# tikz-feynman is not packaged on Debian; vendored under docker/tex (CTAN LPPL).
COPY docker/tex/tikz-feynman /usr/local/share/texmf/tex/latex/tikz-feynman
RUN mktexlsr /usr/local/share/texmf

COPY docker/verify-tex.sh /tmp/verify-tex.sh
RUN chmod +x /tmp/verify-tex.sh && /tmp/verify-tex.sh && rm /tmp/verify-tex.sh

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY api ./api
COPY quantum_reason_adk ./quantum_reason_adk

RUN useradd --create-home --shell /bin/bash appuser \
    && chown -R appuser:appuser /app

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/api/health')"

CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
