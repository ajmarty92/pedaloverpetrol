from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://courier:courier@localhost:5432/courier"

    jwt_secret_key: str = "change-me-in-production"
    jwt_refresh_secret_key: str = "change-me-refresh-secret"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7

    first_admin_email: str = "admin@example.com"
    first_admin_password: str = "changeme"

    log_level: str = "INFO"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
