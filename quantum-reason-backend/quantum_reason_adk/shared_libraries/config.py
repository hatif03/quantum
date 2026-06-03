"""Configuration for Quantum Reason."""

import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Optional

from dotenv import load_dotenv

load_dotenv()

_PACKAGE_ROOT = Path(__file__).parent.parent
_DATA_DIR = _PACKAGE_ROOT / "data"


@dataclass
class ModelConfig:
    k2_api_base: str = field(
        default_factory=lambda: os.getenv("K2_API_BASE", "https://api.k2think.ai/v1")
    )
    k2_think_model: str = field(
        default_factory=lambda: os.getenv("K2_THINK_MODEL", "MBZUAI-IFM/K2-Think-v2")
    )
    embedding_model: str = field(
        default_factory=lambda: os.getenv("EMBEDDING_MODEL", "text-embedding-004")
    )


@dataclass
class KnowledgeBaseConfig:
    local_kb_path: Path = field(default_factory=lambda: _DATA_DIR / "feynman_kb.json")
    local_index_path: Path = field(default_factory=lambda: _DATA_DIR / "feynman_kb.ann")
    local_id_map_path: Path = field(default_factory=lambda: _DATA_DIR / "feynman_kb_id_map.json")

    @property
    def has_local_index(self) -> bool:
        return self.local_index_path.exists()


@dataclass
class SearchConfig:
    default_k: int = field(default_factory=lambda: int(os.getenv("DEFAULT_SEARCH_K", "5")))


@dataclass
class TeachPipelineConfig:
    max_panels: int = field(default_factory=lambda: int(os.getenv("K2_MAX_PANELS", "4")))
    compile_retries: int = field(default_factory=lambda: int(os.getenv("K2_COMPILE_RETRIES", "2")))


@dataclass
class APIConfig:
    google_api_key: Optional[str] = field(default_factory=lambda: os.getenv("GOOGLE_API_KEY"))
    k2_think_api_key: Optional[str] = field(default_factory=lambda: os.getenv("K2_THINK_API_KEY"))


@dataclass
class QuantumReasonConfig:
    models: ModelConfig = field(default_factory=ModelConfig)
    knowledge_base: KnowledgeBaseConfig = field(default_factory=KnowledgeBaseConfig)
    search: SearchConfig = field(default_factory=SearchConfig)
    teach: TeachPipelineConfig = field(default_factory=TeachPipelineConfig)
    api: APIConfig = field(default_factory=APIConfig)

    def validate(self) -> List[str]:
        issues: List[str] = []
        if not self.api.k2_think_api_key:
            issues.append("K2_THINK_API_KEY not set — agent calls will fail")
        if not self.api.google_api_key:
            issues.append("GOOGLE_API_KEY not set — embedding search may fall back to keywords")
        if not self.knowledge_base.local_kb_path.exists():
            issues.append(f"Local KB file not found: {self.knowledge_base.local_kb_path}")
        return issues


config = QuantumReasonConfig()
