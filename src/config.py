from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/courier"
    test_database_url: str = "sqlite+aiosqlite:///./test.db"

    jwt_secret_key: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60

    model_config = {"env_prefix": "COURIER_", "env_file": ".env"}


settings = Settings()
