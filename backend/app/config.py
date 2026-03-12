from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://spanishflow:spanishflow_pass@localhost:5432/spanishflow"
    BOT_TOKEN: Optional[str] = None
    SECRET_KEY: str = "dev_secret"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
