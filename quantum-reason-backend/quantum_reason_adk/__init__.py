"""Quantum Reason ADK package entry point."""

import logging
import os

loglevel = os.getenv("QUANTUM_REASON_LOG_LEVEL", "INFO")
numeric_level = getattr(logging, loglevel.upper(), None)
if not isinstance(numeric_level, int):
    raise ValueError(f"Invalid log level: {loglevel}")
logger = logging.getLogger(__package__)
logger.setLevel(numeric_level)

try:
    from .workflow import quantum_reason_workflow, root_agent
except ImportError as e:
    logger.warning("Could not import workflow: %s", e)
    quantum_reason_workflow = None
    root_agent = None

__all__ = ["quantum_reason_workflow", "root_agent"]
