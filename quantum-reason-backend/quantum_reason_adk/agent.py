"""Legacy agent module — exports quantum_reason_workflow."""

from .workflow import (
    both_pipeline,
    diagram_pipeline,
    explain_pipeline,
    quantum_reason_workflow,
    root_agent,
)

__all__ = [
    "quantum_reason_workflow",
    "root_agent",
    "diagram_pipeline",
    "explain_pipeline",
    "both_pipeline",
]
