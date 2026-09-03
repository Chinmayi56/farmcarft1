"""add products table

Revision ID: c3d9a1f4e857
Revises: b2a85fd20a3e
Create Date: 2026-09-01 07:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "c3d9a1f4e857"
down_revision: Union[str, None] = "b2a85fd20a3e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

product_status_enum = postgresql.ENUM(
    "Active", "Draft", "Out of Stock", name="product_status"
)


def upgrade() -> None:
    product_status_enum.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "products",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("category", sa.String(length=100), nullable=False),
        sa.Column("sku", sa.String(length=100), nullable=False),
        sa.Column("price", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("discount_price", sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column("stock", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "status",
            postgresql.ENUM(
                "Active", "Draft", "Out of Stock", name="product_status", create_type=False
            ),
            nullable=False,
            server_default="Active",
        ),
        sa.Column("image", sa.Text(), nullable=True),
        sa.Column("images", postgresql.ARRAY(sa.Text()), nullable=True),
        sa.Column("motor", sa.String(length=255), nullable=True),
        sa.Column("capacity", sa.String(length=255), nullable=True),
        sa.Column("length", sa.String(length=255), nullable=True),
        sa.Column("height", sa.String(length=255), nullable=True),
        sa.Column("pipe_material", sa.String(length=255), nullable=True),
        sa.Column("screw_material", sa.String(length=255), nullable=True),
        sa.Column("usage", sa.Text(), nullable=True),
        sa.Column("features", postgresql.ARRAY(sa.Text()), nullable=True),
        sa.Column("applications", postgresql.ARRAY(sa.Text()), nullable=True),
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
    op.create_index("ix_products_name", "products", ["name"], unique=False)
    op.create_index("ix_products_category", "products", ["category"], unique=False)
    op.create_index("ix_products_sku", "products", ["sku"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_products_sku", table_name="products")
    op.drop_index("ix_products_category", table_name="products")
    op.drop_index("ix_products_name", table_name="products")
    op.drop_table("products")
    product_status_enum.drop(op.get_bind(), checkfirst=True)
