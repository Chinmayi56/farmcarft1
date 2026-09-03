"""add order_method (visit company)
Revision ID: b7c1e4a9d602
Revises: a3c7f92d5e14

Adds the `order_method` column to `orders` so customers can choose how
they complete an order:
  - "delivery"      -> existing Cash on Delivery flow (unchanged)
  - "visit_company" -> new: customer visits the company to pay/complete
                        the purchase in person

This is NOT a payment method / payment gateway. The existing
`payment_method` column and its `payment_method` enum type are left
completely untouched — Cash on Delivery keeps working exactly as before.

Safe/backward-compatible: no existing table is dropped, truncated, or
recreated. Every existing order row is backfilled to 'delivery' before
the column is made NOT NULL, so no data is lost and no existing order's
behavior changes.
"""
from alembic import op
import sqlalchemy as sa

revision = 'b7c1e4a9d602'
down_revision = 'a3c7f92d5e14'
branch_labels = None
depends_on = None

ORDER_METHOD_ENUM = sa.Enum('delivery', 'visit_company', name='order_method')


def upgrade():
    ORDER_METHOD_ENUM.create(op.get_bind(), checkfirst=True)
    op.add_column(
        'orders',
        sa.Column(
            'order_method',
            ORDER_METHOD_ENUM,
            nullable=True,
        ),
    )
    # Backfill: every order that already exists was placed through the
    # only flow that existed at the time (Cash on Delivery / delivery).
    op.execute("UPDATE orders SET order_method = 'delivery' WHERE order_method IS NULL")
    op.alter_column('orders', 'order_method', nullable=False, server_default='delivery')


def downgrade():
    op.drop_column('orders', 'order_method')
    ORDER_METHOD_ENUM.drop(op.get_bind(), checkfirst=True)
