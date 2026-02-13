"""Application configuration via environment variables."""

from __future__ import annotations

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Settings loaded from environment / .env file."""

    # ── App ─────────────────────────────────────────
    APP_NAME: str = "Life OS Backend"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False

    # ── Database ────────────────────────────────────
    DATABASE_URL: str = "sqlite:///./lifeos.db"

    # ── CORS ────────────────────────────────────────
    CORS_ORIGINS: str = "*"

    # ── External services ───────────────────────────
    OPENAI_API_KEY: str = ""
    REDIS_URL: str = "redis://localhost:6379"

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse comma-separated CORS origins."""
        if self.CORS_ORIGINS == "*":
            return ["*"]
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
    }


settings = Settings()
