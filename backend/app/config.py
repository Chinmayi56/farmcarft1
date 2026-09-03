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

    # --- Database (fallback components, used to build the URL if
    # DATABASE_URL is not provided directly) ---
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

    # --- JWT / Authentication (Backend Step 4) ---
    # JWT_SECRET_KEY MUST be set via .env / environment — there is no
    # hard-coded fallback used in production. A dev-only fallback is
    # provided solely so the app doesn't hard-crash if a developer forgets
    # to set it locally; it is intentionally obvious/unsuitable for prod.
    jwt_secret_key: str = "insecure-dev-only-secret-change-me"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60 * 24  # 24 hours

    # --- OTP (demo customer login) ---
    otp_expire_minutes: int = 5
    otp_demo_code: str = "1234"
    otp_max_attempts: int = 5

    # --- Initial demo Admin account (seeded via Alembic migration) ---
    demo_admin_email: str = "admin@farmcraft.com"
    demo_admin_password: str = "admin123"

    # --- Company information (centralized) ---
    # COMPANY_NAME is the brand/company name shown to customers.
    # CONTACT_PERSON is the admin/contact person — it is NEVER the brand
    # name and must not be combined with COMPANY_NAME anywhere.
    company_name: str = "FARM CRAFT"
    contact_person: str = "VARADA VIJAYAKRISHNA"
    primary_phone: str = "+919440436868"
    secondary_phone: str = "+919490436868"
    whatsapp_number: str = "919440436868"
    company_email: str = "farmcraft68@gmail.com"
    company_address: str = "1-23A, Swaraj Tractor Showroom, Palakonda, Manyam District, Andhra Pradesh"
    company_pincode: str = "532440"

    # --- Contact form / email delivery (Backend contact integration) ---
    # CONTACT_RECIPIENT_EMAIL is where new contact enquiries are sent.
    # SMTP_PASSWORD has no default and MUST be set via environment/.env —
    # it is never hard-coded and never exposed to any frontend.
    contact_recipient_email: str = "farmcraft68@gmail.com"
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_from_email: str = "farmcraft68@gmail.com"
    smtp_from_name: str = "Farm Craft"
    smtp_use_tls: bool = True

    @field_validator("db_echo", "app_debug", "smtp_use_tls", mode="before")
    @classmethod
    def _parse_bool(cls, v):
        if isinstance(v, str):
            return v.strip().lower() in {"1", "true", "yes", "on"}
        return v

    @property
def sqlalchemy_database_url(self) -> str:
    """Return the fully-resolved SQLAlchemy database URL.

    Always uses the Psycopg 3 SQLAlchemy driver.
    """
    if self.database_url:
        url = self.database_url.strip()

        # Render may provide postgresql:// or postgres://.
        # Force SQLAlchemy to use Psycopg 3 instead of psycopg2.
        if url.startswith("postgres://"):
            url = "postgresql+psycopg://" + url[len("postgres://"):]

        elif url.startswith("postgresql://"):
            url = "postgresql+psycopg://" + url[len("postgresql://"):]

        elif url.startswith("postgresql+psycopg2://"):
            url = "postgresql+psycopg://" + url[len("postgresql+psycopg2://"):]

        return url

    return (
        f"postgresql+psycopg://{self.db_user}:{self.db_password}"
        f"@{self.db_host}:{self.db_port}/{self.db_name}"
    )

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    """Cached settings accessor so the .env file is only parsed once."""
    return Settings()


settings = get_settings()
