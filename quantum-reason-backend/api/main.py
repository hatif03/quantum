"""Quantum Reason FastAPI application."""

import importlib.metadata

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routes import diagram, explain, workflow

load_dotenv()

app = FastAPI(
    title="Quantum Reason API",
    description="Reasoning-first physics tutor — K2 Think + ADK 2.x",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(diagram.router, prefix="/api", tags=["diagram"])
app.include_router(explain.router, prefix="/api", tags=["explain"])
app.include_router(workflow.router, prefix="/api", tags=["workflow"])


@app.get("/api/health")
async def health():
    adk_version = "unknown"
    try:
        adk_version = importlib.metadata.version("google-adk")
    except importlib.metadata.PackageNotFoundError:
        pass

    from quantum_reason_adk.shared_libraries.config import config

    issues = config.validate()
    return {
        "status": "ok" if not issues else "degraded",
        "service": "quantum-reason",
        "adk_version": adk_version,
        "model": config.models.k2_think_model,
        "issues": issues,
    }
