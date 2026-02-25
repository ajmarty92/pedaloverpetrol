"""Initial schema — users, drivers, customers, jobs, pods, pricing_rules

Revision ID: 001
Revises:
Create Date: 2026-02-25
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # -- users ----------------------------------------------------------------
    op.create_table(
        "users",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("role", sa.Enum("admin", "dispatcher", "driver", name="userrole"), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_index("ix_users_email", "users", ["email"])
    op.create_index("ix_users_role", "users", ["role"])

    # -- drivers --------------------------------------------------------------
    op.create_table(
        "drivers",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("phone", sa.String(50), nullable=False),
        sa.Column("vehicle_info", sa.String(500), nullable=True),
        sa.Column("status", sa.Enum("on_duty", "off_duty", name="driverstatus"), nullable=False),
        sa.Column("current_lat", sa.Float(), nullable=True),
        sa.Column("current_lng", sa.Float(), nullable=True),
        sa.Column("last_location_update_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("user_id"),
    )
    op.create_index("ix_drivers_user_id", "drivers", ["user_id"])
    op.create_index("ix_drivers_status", "drivers", ["status"])

    # -- customers ------------------------------------------------------------
    op.create_table(
        "customers",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("phone", sa.String(50), nullable=True),
        sa.Column("email", sa.String(255), nullable=True),
        sa.Column("default_address", sa.String(500), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_customers_email", "customers", ["email"])

    # -- jobs -----------------------------------------------------------------
    op.create_table(
        "jobs",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("tracking_id", sa.String(20), nullable=False),
        sa.Column("customer_id", sa.Uuid(), nullable=False),
        sa.Column("driver_id", sa.Uuid(), nullable=True),
        sa.Column("pickup_address", sa.String(500), nullable=False),
        sa.Column("dropoff_address", sa.String(500), nullable=False),
        sa.Column(
            "status",
            sa.Enum("pending", "assigned", "picked_up", "in_transit", "delivered", "failed", name="jobstatus"),
            nullable=False,
        ),
        sa.Column("price", sa.Numeric(10, 2), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["customer_id"], ["customers.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["driver_id"], ["drivers.id"], ondelete="SET NULL"),
        sa.UniqueConstraint("tracking_id"),
    )
    op.create_index("ix_jobs_tracking_id", "jobs", ["tracking_id"])
    op.create_index("ix_jobs_status", "jobs", ["status"])
    op.create_index("ix_jobs_created_at", "jobs", ["created_at"])
    op.create_index("ix_jobs_driver_id", "jobs", ["driver_id"])
    op.create_index("ix_jobs_customer_id", "jobs", ["customer_id"])

    # -- pods -----------------------------------------------------------------
    op.create_table(
        "pods",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("job_id", sa.Uuid(), nullable=False),
        sa.Column("signature_url", sa.String(500), nullable=True),
        sa.Column("photo_urls", sa.JSON(), nullable=True),
        sa.Column("recipient_name", sa.String(255), nullable=False),
        sa.Column("delivered_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("gps_lat", sa.Float(), nullable=True),
        sa.Column("gps_lng", sa.Float(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["job_id"], ["jobs.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("job_id"),
    )

    # -- pricing_rules --------------------------------------------------------
    op.create_table(
        "pricing_rules",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("rule_name", sa.String(255), nullable=False),
        sa.Column("base_rate", sa.Numeric(10, 2), nullable=False),
        sa.Column("per_mile_rate", sa.Numeric(10, 2), nullable=False),
        sa.Column("zone_config", sa.JSON(), nullable=True),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("rule_name"),
    )


def downgrade() -> None:
    op.drop_table("pricing_rules")
    op.drop_table("pods")
    op.drop_table("jobs")
    op.drop_table("customers")
    op.drop_table("drivers")
    op.drop_table("users")
    op.execute("DROP TYPE IF EXISTS jobstatus")
    op.execute("DROP TYPE IF EXISTS driverstatus")
    op.execute("DROP TYPE IF EXISTS userrole")
