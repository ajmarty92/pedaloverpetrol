"""Add user_id FK to customers + 'customer' role to userrole enum

Revision ID: 003
Revises: 002
Create Date: 2026-02-25
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("customers", sa.Column("user_id", sa.Uuid(), nullable=True))
    op.create_unique_constraint("uq_customers_user_id", "customers", ["user_id"])
    op.create_foreign_key(
        "fk_customers_user_id", "customers", "users",
        ["user_id"], ["id"], ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_customers_user_id", "customers", type_="foreignkey")
    op.drop_constraint("uq_customers_user_id", "customers", type_="unique")
    op.drop_column("customers", "user_id")
