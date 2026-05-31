"""Quantum Reason package entry point."""

import logging
import os

loglevel = os.getenv("QUANTUM_REASON_LOG_LEVEL", "INFO")
numeric_level = getattr(logging, loglevel.upper(), None)
if not isinstance(numeric_level, int):
    raise ValueError(f"Invalid log level: {loglevel}")
logger = logging.getLogger(__package__)

__all__: list[str] = []
