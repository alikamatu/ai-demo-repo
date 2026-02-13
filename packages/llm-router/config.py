"""LLM Router configuration."""

from dataclasses import dataclass, field


@dataclass
class LLMConfig:
    """Configuration for LLM provider connections."""

    provider: str = "openai"  # openai | anthropic | google
    model: str = "gpt-4o"
    api_key: str = ""
    max_retries: int = 3
    timeout_seconds: int = 30
    temperature: float = 0.7
    max_tokens: int = 4096
    extra: dict = field(default_factory=dict)
