"""update seeded demo Admin user's display name to the official contact person

Prompt 2 requires the Admin/contact person to be shown as
"VARADA VIJAYAKRISHNA" throughout the Admin application (never combined
with the FARM CRAFT company/brand name). The `b2a85fd20a3e_add_authentication_tables`
migration originally seeded the demo Admin account with the generic
display name "Admin". This migration updates that single row's `name`
column in place — it does not touch the login email/password, role, or
any other authentication data, and does not affect any Admin account
created after the initial seed (a real deployment would set the name at
account-creation time instead).

This is a data-only migration: no schema changes.

Revision ID: e2f6b1d4a733
Revises: d8e5f3a9c012
Create Date: 2026-09-03 00:05:00.000000

"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "e2f6b1d4a733"
down_revision: Union[str, None] = "d8e5f3a9c012"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_DEMO_ADMIN_EMAIL = "admin@farmcraft.com"
_OLD_NAME = "Admin"
_NEW_NAME = "VARADA VIJAYAKRISHNA"


def upgrade() -> None:
    op.execute(
        f"""
        UPDATE users
        SET name = '{_NEW_NAME}'
        WHERE email = '{_DEMO_ADMIN_EMAIL}' AND role = 'ADMIN' AND (name IS NULL OR name = '{_OLD_NAME}')
        """
    )


def downgrade() -> None:
    op.execute(
        f"""
        UPDATE users
        SET name = '{_OLD_NAME}'
        WHERE email = '{_DEMO_ADMIN_EMAIL}' AND role = 'ADMIN' AND name = '{_NEW_NAME}'
        """
    )
