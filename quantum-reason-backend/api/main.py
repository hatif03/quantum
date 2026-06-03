"""Quantum Reason FastAPI application."""

import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routes import compile, debug, diagram, explain

load_dotenv()

app = FastAPI(
    title="Quantum Reason API",
    description="Reasoning-first physics tutor — K2 Think (OpenAI-compatible API)",
    version="1.0.0",
)

_cors_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(diagram.router, prefix="/api", tags=["diagram"])
app.include_router(compile.router, prefix="/api", tags=["compile"])
app.include_router(explain.router, prefix="/api", tags=["explain"])
app.include_router(debug.router, prefix="/api", tags=["debug"])


@app.get("/api/health")
async def health():
    from quantum_reason_adk.shared_libraries.config import config

    issues = config.validate()
    return {
        "status": "ok" if not issues else "degraded",
        "service": "quantum-reason",
        "client": "openai",
        "model": config.models.k2_think_model,
        "issues": issues,
    }
