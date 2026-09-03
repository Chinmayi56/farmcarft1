"""
Application configuration.

Loads settings from environment variables (and a local .env file during
development) using pydantic-settings. No credentials are hard-coded here —
everything is sourced from the environment.
"""

from functools import lru_cache
from typing import List, Optional

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # --- Application ---
    app_name: str = "Farm-Craft API"
    app_env: str = "development"
    app_debug: bool = True
    api_prefix: str = "/api"
    api_version: str = "1.0.0"

    # --- Database (primary) ---
    database_url: Optional[str] = None

    # --- Database (fallback components) ---
    db_user: str = "postgres"
    db_password: str = ""
    db_host: str = "localhost"
    db_port: int = 5432
    db_name: str = "farmcraft_db"

    # --- SQLAlchemy engine tuning ---
    db_pool_size: int = 5
    db_max_overflow: int = 10
    db_pool_timeout: int = 30
    db_echo: bool = False

    # --- CORS ---
    cors_origins: str = "http://localhost:5173,http://localhost:5174"

    # --- JWT / Authentication ---
    jwt_secret_key: str = "insecure-dev-only-secret-change-me"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60 * 24

    # --- OTP (demo customer login) ---
    otp_expire_minutes: int = 5
    otp_demo_code: str = "1234"
    otp_max_attempts: int = 5

    # --- Initial demo Admin account ---
    demo_admin_email: str = "admin@farmcraft.com"
    demo_admin_password: str = "admin123"

    # --- Company information ---
    company_name: str = "FARM CRAFT"
    contact_person: str = "VARADA VIJAYAKRISHNA"
    primary_phone: str = "+919440436868"
    secondary_phone: str = "+919490436868"
    whatsapp_number: str = "919440436868"
    company_email: str = "farmcraft68@gmail.com"
    company_address: str = (
        "1-23A, Swaraj Tractor Showroom, Palakonda, "
        "Manyam District, Andhra Pradesh"
    )
    company_pincode: str = "532440"

    # --- Contact form / email delivery ---
    contact_recipient_email: str = "farmcraft68@gmail.com"
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_from_email: str = "farmcraft68@gmail.com"
    smtp_from_name: str = "Farm Craft"
    smtp_use_tls: bool = True

    # --- Boolean environment variable parser ---
    @field_validator("db_echo", "app_debug", "smtp_use_tls", mode="before")
    @classmethod
    def _parse_bool(cls, v):
        if isinstance(v, str):
            return v.strip().lower() in {
                "1",
                "true",
                "yes",
                "on",
            }
        return v

    # --- SQLAlchemy Database URL ---
    @property
    def sqlalchemy_database_url(self) -> str:
        """
        Return the fully-resolved SQLAlchemy database URL.

        Always uses the Psycopg 3 SQLAlchemy driver.
        """

        if self.database_url:
            url = self.database_url.strip()

            # Render may provide:
            # postgres://...
            # Convert it to Psycopg 3 format.
            if url.startswith("postgres://"):
                url = (
                    "postgresql+psycopg://"
                    + url[len("postgres://"):]
                )

            # Render may provide:
            # postgresql://...
            # Convert it to Psycopg 3 format.
            elif url.startswith("postgresql://"):
                url = (
                    "postgresql+psycopg://"
                    + url[len("postgresql://"):]
                )

            # If an old psycopg2 URL is present,
            # convert it to Psycopg 3.
            elif url.startswith("postgresql+psycopg2://"):
                url = (
                    "postgresql+psycopg://"
                    + url[len("postgresql+psycopg2://"):]
                )

            return url

        # Local development fallback.
        return (
            f"postgresql+psycopg://"
            f"{self.db_user}:{self.db_password}"
            f"@{self.db_host}:{self.db_port}/{self.db_name}"
        )

    # --- CORS origins as a list ---
    @property
    def cors_origins_list(self) -> List[str]:
        return [
            origin.strip()
            for origin in self.cors_origins.split(",")
            if origin.strip()
        ]


@lru_cache
def get_settings() -> Settings:
    """
    Cached settings accessor so the .env file is only parsed once.
    """
    return Settings()


settings = get_settings()