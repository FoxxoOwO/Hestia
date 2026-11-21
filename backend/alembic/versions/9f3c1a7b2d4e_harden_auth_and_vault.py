"""harden auth and vault

Revision ID: 9f3c1a7b2d4e
Revises: 475f56d6d79d
Create Date: 2026-11-21

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '9f3c1a7b2d4e'
down_revision: Union[str, None] = '475f56d6d79d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Příznak povinné změny hesla pro nově vytvořené účty.
    op.add_column(
        'users',
        sa.Column(
            'must_change_password',
            sa.Boolean(),
            nullable=False,
            server_default=sa.text('0'),
        ),
    )


def downgrade() -> None:
    op.drop_column('users', 'must_change_password')
