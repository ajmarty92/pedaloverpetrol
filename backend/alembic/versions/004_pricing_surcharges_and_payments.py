"""Add surcharge columns to pricing_rules, payment fields to jobs

Revision ID: 004
Revises: 003
Create Date: 2026-02-25
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("pricing_rules", sa.Column("rush_surcharge", sa.Numeric(10, 2), nullable=False, server_default="0"))
    op.add_column("pricing_rules", sa.Column("heavy_surcharge", sa.Numeric(10, 2), nullable=False, server_default="0"))

    op.add_column("jobs", sa.Column("payment_status", sa.String(20), nullable=False, server_default="unpaid"))
    op.add_column("jobs", sa.Column("stripe_payment_intent_id", sa.String(255), nullable=True))


def downgrade() -> None:
    op.drop_column("jobs", "stripe_payment_intent_id")
    op.drop_column("jobs", "payment_status")
    op.drop_column("pricing_rules", "heavy_surcharge")
    op.drop_column("pricing_rules", "rush_surcharge")
