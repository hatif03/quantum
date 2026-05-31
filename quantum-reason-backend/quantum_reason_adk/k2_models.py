"""K2 Think model configuration via LiteLLM for ADK agents."""

import os

from dotenv import load_dotenv
from google.adk.models.lite_llm import LiteLlm

load_dotenv()

K2_API_BASE = os.getenv("K2_API_BASE", "https://api.k2think.ai/v1")
K2_API_KEY = os.getenv("K2_THINK_API_KEY", "")

if K2_API_KEY:
    os.environ.setdefault("OPENAI_API_KEY", K2_API_KEY)

# IFM K2 keys currently require streaming; non-stream requests return 400.
# This key is provisioned for K2-Think-v2 (Instruct may be unavailable).
K2_THINK_MODEL_ID = os.getenv("K2_THINK_MODEL", "MBZUAI-IFM/K2-Think-v2")
K2_INSTRUCT_MODEL_ID = os.getenv("K2_INSTRUCT_MODEL", K2_THINK_MODEL_ID)


def _litellm_model(model_id: str) -> LiteLlm:
    return LiteLlm(
        model=model_id,
        api_base=K2_API_BASE,
        api_key=K2_API_KEY or None,
        custom_llm_provider="openai",
    )


def get_k2_think_model() -> LiteLlm:
    """Reasoning model — K2 Think v2 (streaming required by IFM API)."""
    return _litellm_model(K2_THINK_MODEL_ID)


def get_k2_instruct_model() -> LiteLlm:
    """Fast model — falls back to K2 Think when Instruct is unavailable."""
    return _litellm_model(K2_INSTRUCT_MODEL_ID)
