"""add cart orders stock
Revision ID: d4f2c6b8a101
Revises: c3d9a1f4e857
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
revision='d4f2c6b8a101'; down_revision='c3d9a1f4e857'; branch_labels=None; depends_on=None

def upgrade():
    op.create_table('carts',sa.Column('id',postgresql.UUID(as_uuid=True),primary_key=True),sa.Column('customer_id',postgresql.UUID(as_uuid=True),sa.ForeignKey('users.id',ondelete='CASCADE'),nullable=False,unique=True),sa.Column('created_at',sa.DateTime(timezone=True),nullable=False),sa.Column('updated_at',sa.DateTime(timezone=True),nullable=False))
    op.create_table('cart_items',sa.Column('id',postgresql.UUID(as_uuid=True),primary_key=True),sa.Column('cart_id',postgresql.UUID(as_uuid=True),sa.ForeignKey('carts.id',ondelete='CASCADE'),nullable=False),sa.Column('product_id',postgresql.UUID(as_uuid=True),sa.ForeignKey('products.id',ondelete='RESTRICT'),nullable=False),sa.Column('quantity',sa.Integer(),nullable=False))
    op.create_table('orders',sa.Column('id',postgresql.UUID(as_uuid=True),primary_key=True),sa.Column('order_number',sa.String(40),unique=True,nullable=False),sa.Column('purchase_code',sa.String(40),unique=True,nullable=False),sa.Column('customer_id',postgresql.UUID(as_uuid=True),sa.ForeignKey('users.id',ondelete='RESTRICT'),nullable=False),sa.Column('status',sa.Enum('Pending','Confirmed','Processing','Dispatched','Delivered','Cancelled',name='order_status'),nullable=False),sa.Column('payment_method',sa.Enum('Cash on Delivery',name='payment_method'),nullable=False),sa.Column('payment_status',sa.Enum('Pending','Paid','Refunded',name='payment_status'),nullable=False),sa.Column('total_amount',sa.Numeric(12,2),nullable=False),sa.Column('shipping_address',postgresql.JSONB(),nullable=False),sa.Column('customer_snapshot',postgresql.JSONB(),nullable=False),sa.Column('created_at',sa.DateTime(timezone=True),nullable=False),sa.Column('updated_at',sa.DateTime(timezone=True),nullable=False))
    op.create_table('order_items',sa.Column('id',postgresql.UUID(as_uuid=True),primary_key=True),sa.Column('order_id',postgresql.UUID(as_uuid=True),sa.ForeignKey('orders.id',ondelete='CASCADE'),nullable=False),sa.Column('product_id',postgresql.UUID(as_uuid=True),sa.ForeignKey('products.id',ondelete='RESTRICT'),nullable=False),sa.Column('product_name',sa.String(255),nullable=False),sa.Column('sku',sa.String(100),nullable=False),sa.Column('quantity',sa.Integer(),nullable=False),sa.Column('unit_price',sa.Numeric(12,2),nullable=False),sa.Column('subtotal',sa.Numeric(12,2),nullable=False),sa.Column('configuration',sa.Text(),nullable=True))
    op.create_table('stock_movements',sa.Column('id',postgresql.UUID(as_uuid=True),primary_key=True),sa.Column('product_id',postgresql.UUID(as_uuid=True),sa.ForeignKey('products.id',ondelete='CASCADE'),nullable=False),sa.Column('quantity_change',sa.Integer(),nullable=False),sa.Column('reason',sa.String(100),nullable=False),sa.Column('reference_id',sa.String(100),nullable=True),sa.Column('created_at',sa.DateTime(timezone=True),nullable=False))
    for table, cols in [('carts',['customer_id']),('cart_items',['cart_id','product_id']),('orders',['customer_id','status','created_at']),('order_items',['order_id']),('stock_movements',['product_id'])]:
        for col in cols: op.create_index(f'ix_{table}_{col}',table,[col])

def downgrade():
    op.drop_table('stock_movements'); op.drop_table('order_items'); op.drop_table('orders'); op.drop_table('cart_items'); op.drop_table('carts');
    op.execute('DROP TYPE IF EXISTS payment_status'); op.execute('DROP TYPE IF EXISTS payment_method'); op.execute('DROP TYPE IF EXISTS order_status')
