"""add authentication tables (users, otps) + seed initial demo admin

Revision ID: b2a85fd20a3e
Revises: 005bee97ef12
Create Date: 2026-09-01 06:00:00.000000

"""
import uuid
from datetime import datetime, timezone
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "b2a85fd20a3e"
down_revision: Union[str, None] = "005bee97ef12"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# --- Seed data for the initial demo Admin account -------------------------
# The plain-text password is NEVER stored — this is a pre-computed
# pbkdf2_sha256 hash (see app.utils.security.hash_secret) of the existing
# demo Admin credentials already used by the Admin frontend
# (admin@farmcraft.com / admin123). The salt is embedded in the hash
# string itself, so this is safe to keep in the migration.
_DEMO_ADMIN_ID = "d072925e-3316-415c-a8af-c013e9467f30"
_DEMO_ADMIN_EMAIL = "admin@farmcraft.com"
_DEMO_ADMIN_NAME = "Admin"
_DEMO_ADMIN_PASSWORD_HASH = (
    "pbkdf2_sha256$260000$e03686a53bf1dd2a2fcb64ce1928341c"
    "$3bcd87f05eeb2efdda36076ac1be1c916c1016dc4fb1b3a14a1d9d56ee68696f"
)

user_role_enum = postgresql.ENUM("ADMIN", "CUSTOMER", name="user_role")


def upgrade() -> None:
    user_role_enum.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(length=150), nullable=True),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=True),
        sa.Column(
            "role",
            postgresql.ENUM("ADMIN", "CUSTOMER", name="user_role", create_type=False),
            nullable=False,
        ),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "otps",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("otp_hash", sa.String(length=255), nullable=False),
        sa.Column("attempts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_used", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_otps_email", "otps", ["email"], unique=False)

    # --- Seed the initial demo Admin account ---
    users_table = sa.table(
        "users",
        sa.column("id", postgresql.UUID(as_uuid=True)),
        sa.column("name", sa.String),
        sa.column("email", sa.String),
        sa.column("password_hash", sa.String),
        sa.column(
            "role",
            postgresql.ENUM("ADMIN", "CUSTOMER", name="user_role", create_type=False),
        ),
        sa.column("is_active", sa.Boolean),
    )
    op.bulk_insert(
        users_table,
        [
            {
                "id": uuid.UUID(_DEMO_ADMIN_ID),
                "name": _DEMO_ADMIN_NAME,
                "email": _DEMO_ADMIN_EMAIL,
                "password_hash": _DEMO_ADMIN_PASSWORD_HASH,
                "role": "ADMIN",
                "is_active": True,
            }
        ],
    )


def downgrade() -> None:
    op.drop_index("ix_otps_email", table_name="otps")
    op.drop_table("otps")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
    user_role_enum.drop(op.get_bind(), checkfirst=True)
