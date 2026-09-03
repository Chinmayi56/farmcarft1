"""normalize product_status enum to lowercase

The `c3d9a1f4e857_add_products_table` migration originally created the
PostgreSQL `product_status` enum with Title Case labels ("Active",
"Draft", "Out of Stock"). The application/model layer has since been
fixed to use the lowercase labels that the enum should actually contain
("active", "draft", "out of stock") so that Admin → Add Product no longer
sends a value PostgreSQL rejects with `InvalidTextRepresentation`.

This migration reconciles the two, WITHOUT dropping the `products` table
or recreating the database:

- Renames each existing Title Case enum label to its lowercase
  equivalent in place (`ALTER TYPE ... RENAME VALUE`), which
  automatically updates every row's `status` column to match — no data
  is lost or rewritten by hand.
- Updates the column's server-side default from "Active" to "active" to
  match.
- Is fully idempotent: every rename is guarded by a check against
  `pg_enum`, so running this against a database where the enum already
  has lowercase labels (as already confirmed in production) is a no-op
  and will not error.

Revision ID: f1a6c8e2b933
Revises: e7b4d2c9f311
Create Date: 2026-09-02 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "f1a6c8e2b933"
down_revision: Union[str, None] = "e7b4d2c9f311"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# (old_label, new_label) pairs, old label first so the rename is a no-op
# (skipped) once already applied.
_RENAMES = [
    ("Active", "active"),
    ("Draft", "draft"),
    ("Out of Stock", "out of stock"),
]


def upgrade() -> None:
    for old_label, new_label in _RENAMES:
        op.execute(
            f"""
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM pg_enum e
                    JOIN pg_type t ON t.oid = e.enumtypid
                    WHERE t.typname = 'product_status' AND e.enumlabel = '{old_label}'
                ) AND NOT EXISTS (
                    SELECT 1 FROM pg_enum e
                    JOIN pg_type t ON t.oid = e.enumtypid
                    WHERE t.typname = 'product_status' AND e.enumlabel = '{new_label}'
                ) THEN
                    ALTER TYPE product_status RENAME VALUE '{old_label}' TO '{new_label}';
                END IF;
            END
            $$;
            """
        )

    # Bring the column default in line with the (now lowercase) enum
    # label. Safe/idempotent to re-run.
    op.execute("ALTER TABLE products ALTER COLUMN status SET DEFAULT 'active'")


def downgrade() -> None:
    for old_label, new_label in _RENAMES:
        op.execute(
            f"""
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM pg_enum e
                    JOIN pg_type t ON t.oid = e.enumtypid
                    WHERE t.typname = 'product_status' AND e.enumlabel = '{new_label}'
                ) AND NOT EXISTS (
                    SELECT 1 FROM pg_enum e
                    JOIN pg_type t ON t.oid = e.enumtypid
                    WHERE t.typname = 'product_status' AND e.enumlabel = '{old_label}'
                ) THEN
                    ALTER TYPE product_status RENAME VALUE '{new_label}' TO '{old_label}';
                END IF;
            END
            $$;
            """
        )
    op.execute("ALTER TABLE products ALTER COLUMN status SET DEFAULT 'Active'")
