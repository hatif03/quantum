"""Configuration settings for Quantum Reason ADK."""

import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv

load_dotenv()


@dataclass
class ModelConfig:
    """Model configuration settings."""

    model_name: str = field(
        default_factory=lambda: os.getenv("ADK_MODEL_NAME", "MBZUAI-IFM/K2-V2-Instruct")
    )
    temperature: float = field(default_factory=lambda: float(os.getenv("MODEL_TEMPERATURE", "0.3")))
    max_tokens: int = field(default_factory=lambda: int(os.getenv("MODEL_MAX_TOKENS", "8192")))

    embedding_model: str = field(
        default_factory=lambda: os.getenv("EMBEDDING_MODEL", "text-embedding-004")
    )
    embedding_dim: int = 768

    k2_api_base: str = field(
        default_factory=lambda: os.getenv("K2_API_BASE", "https://api.k2think.ai/v1")
    )
    k2_think_model: str = field(
        default_factory=lambda: os.getenv("K2_THINK_MODEL", "MBZUAI-IFM/K2-Think-v2")
    )
    k2_instruct_model: str = field(
        default_factory=lambda: os.getenv("K2_INSTRUCT_MODEL", "MBZUAI-IFM/K2-Think-v2")
    )

    planner_model: str = field(default_factory=lambda: os.getenv("PLANNER_MODEL", "k2_think"))
    generator_model: str = field(default_factory=lambda: os.getenv("GENERATOR_MODEL", "k2_think"))
    physics_validator_model: str = field(
        default_factory=lambda: os.getenv("PHYSICS_VALIDATOR_MODEL", "k2_think")
    )
    math_explainer_model: str = field(
        default_factory=lambda: os.getenv("MATH_EXPLAINER_MODEL", "k2_think")
    )

    kb_retriever_model: str = field(
        default_factory=lambda: os.getenv("KB_RETRIEVER_MODEL", "k2_instruct")
    )
    tikz_validator_model: str = field(
        default_factory=lambda: os.getenv("TIKZ_VALIDATOR_MODEL", "k2_instruct")
    )
    feedback_model: str = field(default_factory=lambda: os.getenv("FEEDBACK_MODEL", "k2_instruct"))


@dataclass
class KnowledgeBaseConfig:
    """Knowledge base configuration."""

    mode: str = field(default_factory=lambda: os.getenv("KB_MODE", "local").lower())
    data_dir: Path = field(default_factory=lambda: Path(__file__).parent.parent / "data")
    local_kb_path: Path = field(
        default_factory=lambda: Path(__file__).parent.parent / "data" / "feynman_kb.json"
    )
    local_index_path: Path = field(
        default_factory=lambda: Path(__file__).parent.parent / "data" / "feynman_kb.ann"
    )
    local_id_map_path: Path = field(
        default_factory=lambda: Path(__file__).parent.parent / "data" / "feynman_kb_id_map.json"
    )

    @property
    def use_bigquery(self) -> bool:
        return False

    @property
    def use_local_kb(self) -> bool:
        return True

    @property
    def has_local_index(self) -> bool:
        return self.local_index_path.exists()


@dataclass
class SearchConfig:
    default_k: int = field(default_factory=lambda: int(os.getenv("DEFAULT_SEARCH_K", "5")))
    max_k: int = field(default_factory=lambda: int(os.getenv("MAX_SEARCH_K", "20")))
    timeout_seconds: int = field(default_factory=lambda: int(os.getenv("SEARCH_TIMEOUT", "30")))
    similarity_threshold: float = field(
        default_factory=lambda: float(os.getenv("SIMILARITY_THRESHOLD", "0.7"))
    )
    vector_weight: float = field(default_factory=lambda: float(os.getenv("VECTOR_WEIGHT", "0.6")))
    keyword_weight: float = field(default_factory=lambda: float(os.getenv("KEYWORD_WEIGHT", "0.4")))


@dataclass
class ValidationConfig:
    latex_executable: str = field(default_factory=lambda: os.getenv("LATEX_EXECUTABLE", "pdflatex"))
    latex_timeout: int = field(default_factory=lambda: int(os.getenv("LATEX_TIMEOUT", "30")))
    physics_rules_path: Path = field(
        default_factory=lambda: Path(__file__).parent.parent / "data" / "pprules.json"
    )
    enable_physics_validation: bool = field(
        default_factory=lambda: os.getenv("ENABLE_PHYSICS_VALIDATION", "true").lower() == "true"
    )
    strict_physics_mode: bool = field(
        default_factory=lambda: os.getenv("STRICT_PHYSICS_MODE", "false").lower() == "true"
    )


@dataclass
class APIConfig:
    google_api_key: Optional[str] = field(default_factory=lambda: os.getenv("GOOGLE_API_KEY"))
    k2_think_api_key: Optional[str] = field(default_factory=lambda: os.getenv("K2_THINK_API_KEY"))
    google_credentials_path: Optional[str] = field(
        default_factory=lambda: os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    )
    requests_per_minute: int = field(
        default_factory=lambda: int(os.getenv("REQUESTS_PER_MINUTE", "30"))
    )
    retry_attempts: int = field(default_factory=lambda: int(os.getenv("RETRY_ATTEMPTS", "3")))


@dataclass
class LoggingConfig:
    level: str = field(default_factory=lambda: os.getenv("LOG_LEVEL", "INFO"))
    format: str = field(
        default_factory=lambda: os.getenv(
            "LOG_FORMAT", "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        )
    )
    file_path: Optional[str] = field(default_factory=lambda: os.getenv("LOG_FILE"))
    max_file_size: int = field(default_factory=lambda: int(os.getenv("LOG_MAX_SIZE", "10485760")))


@dataclass
class QuantumReasonConfig:
    """Main configuration for Quantum Reason."""

    models: ModelConfig = field(default_factory=ModelConfig)
    knowledge_base: KnowledgeBaseConfig = field(default_factory=KnowledgeBaseConfig)
    search: SearchConfig = field(default_factory=SearchConfig)
    validation: ValidationConfig = field(default_factory=ValidationConfig)
    api: APIConfig = field(default_factory=APIConfig)
    logging: LoggingConfig = field(default_factory=LoggingConfig)

    def validate(self) -> List[str]:
        issues: List[str] = []
        if not self.api.k2_think_api_key:
            issues.append("K2_THINK_API_KEY not set — agent calls will fail")
        if not self.api.google_api_key:
            issues.append("GOOGLE_API_KEY not set — embedding search may fall back to keywords")
        if self.knowledge_base.use_local_kb and not self.knowledge_base.local_kb_path.exists():
            issues.append(f"Local KB file not found: {self.knowledge_base.local_kb_path}")
        if (
            self.validation.enable_physics_validation
            and not self.validation.physics_rules_path.exists()
        ):
            issues.append(f"Physics rules not found: {self.validation.physics_rules_path}")
        return issues


config = QuantumReasonConfig()

# Backward compatibility aliases
FeynmanCraftConfig = QuantumReasonConfig
KB_MODE = config.knowledge_base.mode
USE_BIGQUERY = False
USE_LOCAL_KB = config.knowledge_base.use_local_kb
LOCAL_KB_PATH = config.knowledge_base.local_kb_path
LOCAL_INDEX_PATH = config.knowledge_base.local_index_path
LOCAL_ID_MAP_PATH = config.knowledge_base.local_id_map_path
EMBEDDING_MODEL = config.models.embedding_model
EMBEDDING_DIM = config.models.embedding_dim
DEFAULT_SEARCH_K = config.search.default_k
SEARCH_TIMEOUT = config.search.timeout_seconds
GOOGLE_API_KEY = config.api.google_api_key
LOG_LEVEL = config.logging.level


def get_kb_config() -> Dict[str, Any]:
    return {
        "mode": config.knowledge_base.mode,
        "use_bigquery": False,
        "use_local": config.knowledge_base.use_local_kb,
        "local": {
            "kb_path": str(config.knowledge_base.local_kb_path),
            "index_path": str(config.knowledge_base.local_index_path),
            "has_index": config.knowledge_base.has_local_index,
        },
    }


def validate_config() -> List[str]:
    return config.validate()


def get_model_for_agent(agent_type: str):
    """Return LiteLLM model wrapper for agent type."""
    from ..k2_models import get_k2_instruct_model, get_k2_think_model

    think_agents = {"planner", "generator", "physics_validator", "math_explainer", "validator"}
    if agent_type in think_agents:
        return get_k2_think_model()
    if agent_type in {"kb_retriever", "tikz_validator", "feedback"}:
        return get_k2_instruct_model()
    return get_k2_instruct_model()
