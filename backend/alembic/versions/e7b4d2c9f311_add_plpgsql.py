"""PL/pgSQL stock function and updated_at trigger
Revision ID: e7b4d2c9f311
Revises: d4f2c6b8a101
"""
from alembic import op
revision='e7b4d2c9f311'; down_revision='d4f2c6b8a101'; branch_labels=None; depends_on=None

def upgrade():
    op.execute("""CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at=NOW(); RETURN NEW; END; $$;""")
    op.execute("""CREATE OR REPLACE FUNCTION decrement_product_stock(p_product_id uuid,p_quantity integer) RETURNS void LANGUAGE plpgsql AS $$ BEGIN IF p_quantity <= 0 THEN RAISE EXCEPTION 'Quantity must be positive'; END IF; UPDATE products SET stock=stock-p_quantity WHERE id=p_product_id AND stock>=p_quantity; IF NOT FOUND THEN RAISE EXCEPTION 'Insufficient stock'; END IF; END; $$;""")
    op.execute("""DROP TRIGGER IF EXISTS products_set_updated_at ON products; CREATE TRIGGER products_set_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION set_updated_at();""")

def downgrade():
    op.execute('DROP TRIGGER IF EXISTS products_set_updated_at ON products'); op.execute('DROP FUNCTION IF EXISTS decrement_product_stock(uuid,integer)'); op.execute('DROP FUNCTION IF EXISTS set_updated_at()')
