# Quantum Reason

Reasoning-first physics tutor for the [Build with K2 Think V2](https://build.k2think.ai/) hackathon.

Pen-and-paper frontend + multi-agent backend: Feynman diagrams, physics validation, and step-by-step math explanations powered by **K2 Think v2** and **Google ADK 2.x**.

## Backend (`quantum-reason-backend`)

```bash
cd quantum-reason-backend
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt   # Windows
cp .env.example .env   # set K2_THINK_API_KEY
uvicorn api.main:app --reload --port 8000
```

ADK dev UI (optional): `adk web --port 8001 quantum_reason_adk`

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
| POST | `/api/diagram` | Diagram / explain / both (`mode` field) |
| POST | `/api/explain` | Math explanation only |
| GET | `/api/workflow/stream?session_id=` | SSE workflow steps |

## Architecture

- **ADK 2.x** `SequentialAgent` + `LoopAgent` (deterministic pipeline)
- **K2 Think v2** via LiteLLM for reasoning agents
- **K2-V2-Instruct** for fast I/O agents
- FastAPI bridge for React frontend
