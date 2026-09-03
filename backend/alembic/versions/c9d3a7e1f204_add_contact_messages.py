"""add contact messages
Revision ID: c9d3a7e1f204
Revises: b7c1e4a9d602
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = 'c9d3a7e1f204'; down_revision = 'b7c1e4a9d602'; branch_labels = None; depends_on = None


def upgrade():
    op.create_table(
        'contact_messages',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(150), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('phone', sa.String(30), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('status', sa.Enum('New', 'Read', 'Resolved', name='contact_message_status'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_contact_messages_email', 'contact_messages', ['email'])
    op.create_index('ix_contact_messages_status', 'contact_messages', ['status'])
    op.create_index('ix_contact_messages_created_at', 'contact_messages', ['created_at'])


def downgrade():
    op.drop_table('contact_messages')
    op.execute('DROP TYPE IF EXISTS contact_message_status')
