# Quantum Reason

Reasoning-first physics tutor for the [Build with K2 Think V2](https://build.k2think.ai/) hackathon.

Pen-and-paper frontend + backend: Feynman diagrams, physics validation, and step-by-step math explanations powered by **K2 Think v2** via the **OpenAI-compatible** API (`openai` Python SDK).

## Backend (`quantum-reason-backend`)

```bash
cd quantum-reason-backend
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt   # Windows
cp .env.example .env   # set K2_THINK_API_KEY
uvicorn api.main:app --reload --port 8000
```

Test K2 connectivity: `python scripts/test_k2_client.py`

## Docker (production API + headless TikZ)

The image includes **TeX Live** (`pdflatex`) and **Poppler** (`pdftoppm`) so diagram requests return compiled PNGs without interactive MiKTeX package prompts.

```bash
cd quantum-reason-backend
docker build -t quantum-reason-api .
docker run --rm -p 8000:8000 \
  -e K2_THINK_API_KEY=your-key \
  -e CORS_ORIGINS=https://your-frontend.example \
  -e QUANTUM_DEBUG=1 \
  -v "$(pwd)/logs:/app/logs" \
  quantum-reason-api
```

- Set `CORS_ORIGINS` to your hosted frontend URL(s), comma-separated.
- Mount `logs` so Teach-mode session artifacts persist (`QUANTUM_LOG_DIR`, default `./logs/sessions`).
- Inspect logs: `GET /api/debug/sessions` and `GET /api/debug/sessions/{id}` when `QUANTUM_DEBUG=1` or `QUANTUM_ENV=dev`.
- The UI shows `debug_session_id` on each response when logging is enabled.
- Local dev CORS still allows any `localhost` / `127.0.0.1` port via regex.
- Image build runs a smoke test that compiles a minimal `tikz-feynman` diagram.
- `tikz-feynman` is vendored under `docker/tex/` (LPPL) so builds do not depend on CTAN mirrors.

## Frontend (`quantum-frontend`)

```bash
cd quantum-frontend
npm install
npm run dev
```

Set `VITE_API_BASE_URL=http://localhost:8000` in `.env`.

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Service status |
| POST | `/api/diagram` | Diagram / explain / teach (`mode`: `diagram`, `explain`, `both`, `teach`) |
| POST | `/api/explain` | Math explanation only |

## Architecture

- **OpenAI Python SDK** → `https://api.k2think.ai/v1` with `stream=True` (required by K2 IFM)
- **Plain async pipelines**: `diagram` (single TikZ), `explain` (math JSON), `both`/`teach` (sequential plan → multi-panel diagrams → compile/retry → math; expect ~3–6 min)
- **Standalone LaTeX** + paper-matched PNG (`#f4f0e8`), optional `pdfcrop`, 250 DPI
- FastAPI bridge for React frontend
