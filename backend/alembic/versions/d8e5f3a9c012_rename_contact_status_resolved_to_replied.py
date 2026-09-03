"""rename contact_message_status 'Resolved' to 'Replied'

Prompt 2 standardizes the Contact Message status workflow on:

    NEW -> READ -> REPLIED

The `c9d3a7e1f204_add_contact_messages` migration originally created the
PostgreSQL `contact_message_status` enum with the label "Resolved" for
the final state. The application/model layer now uses "Replied" for
that same final state, so this migration reconciles the two WITHOUT
dropping the `contact_messages` table or losing any data:

- Renames the existing "Resolved" enum label to "Replied" in place
  (`ALTER TYPE ... RENAME VALUE`), which automatically updates every
  row's `status` column to match — no data is lost or rewritten by
  hand.
- Is fully idempotent: the rename is guarded by a check against
  `pg_enum`, so running this against a database where the enum already
  has the "Replied" label is a no-op and will not error.

Revision ID: d8e5f3a9c012
Revises: c9d3a7e1f204
Create Date: 2026-09-03 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "d8e5f3a9c012"
down_revision: Union[str, None] = "c9d3a7e1f204"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_OLD_LABEL = "Resolved"
_NEW_LABEL = "Replied"


def upgrade() -> None:
    op.execute(
        f"""
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM pg_enum e
                JOIN pg_type t ON t.oid = e.enumtypid
                WHERE t.typname = 'contact_message_status' AND e.enumlabel = '{_OLD_LABEL}'
            ) AND NOT EXISTS (
                SELECT 1 FROM pg_enum e
                JOIN pg_type t ON t.oid = e.enumtypid
                WHERE t.typname = 'contact_message_status' AND e.enumlabel = '{_NEW_LABEL}'
            ) THEN
                ALTER TYPE contact_message_status RENAME VALUE '{_OLD_LABEL}' TO '{_NEW_LABEL}';
            END IF;
        END
        $$;
        """
    )


def downgrade() -> None:
    op.execute(
        f"""
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM pg_enum e
                JOIN pg_type t ON t.oid = e.enumtypid
                WHERE t.typname = 'contact_message_status' AND e.enumlabel = '{_NEW_LABEL}'
            ) AND NOT EXISTS (
                SELECT 1 FROM pg_enum e
                JOIN pg_type t ON t.oid = e.enumtypid
                WHERE t.typname = 'contact_message_status' AND e.enumlabel = '{_OLD_LABEL}'
            ) THEN
                ALTER TYPE contact_message_status RENAME VALUE '{_NEW_LABEL}' TO '{_OLD_LABEL}';
            END IF;
        END
        $$;
        """
    )
