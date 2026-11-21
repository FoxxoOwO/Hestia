"""add token_version

Revision ID: b7c2d9e4f1a3
Revises: 9f3c1a7b2d4e
Create Date: 2026-11-21

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'b7c2d9e4f1a3'
down_revision: Union[str, None] = '9f3c1a7b2d4e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'users',
        sa.Column('token_version', sa.Integer(), nullable=False, server_default=sa.text('0')),
    )


def downgrade() -> None:
    op.drop_column('users', 'token_version')
