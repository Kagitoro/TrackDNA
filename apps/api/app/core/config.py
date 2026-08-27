from __future__ import annotations

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg://trackdna:trackdna@localhost:5432/trackdna"
    redis_url: str = "redis://localhost:6379/0"
    upload_dir: Path = Path("data/uploads")
    similarity_weights: dict[str, float] = {
        "embedding": 0.35,
        "bass": 0.20,
        "kick": 0.10,
        "groove": 0.15,
        "structure": 0.10,
        "vocal": 0.05,
        "energy": 0.05,
    }

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
