"""App settings, read from environment variables (or backend/.env)."""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql://postgres:postgres@localhost:5432/whitelotus"
    admin_api_key: str = "change-me"
    cors_origins: str = "http://localhost:5173"

    @property
    def sqlalchemy_url(self) -> str:
        """Hosts like Render/Heroku hand out `postgres://...` URLs.
        SQLAlchemy needs the driver spelled out, so normalise to psycopg (v3)."""
        url = self.database_url
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+psycopg://", 1)
        elif url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+psycopg://", 1)
        return url

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
