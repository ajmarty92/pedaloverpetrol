import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Index, Numeric, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.db.base import Base


class JobStatus(str, enum.Enum):
    PENDING = "pending"
    ASSIGNED = "assigned"
    PICKED_UP = "picked_up"
    IN_TRANSIT = "in_transit"
    DELIVERED = "delivered"
    FAILED = "failed"


class Job(Base):
    __tablename__ = "jobs"

    tracking_id: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    customer_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("customers.id", ondelete="RESTRICT"), nullable=False,
    )
    driver_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("drivers.id", ondelete="SET NULL"), nullable=True,
    )
    pickup_address: Mapped[str] = mapped_column(String(500), nullable=False)
    dropoff_address: Mapped[str] = mapped_column(String(500), nullable=False)
    status: Mapped[JobStatus] = mapped_column(default=JobStatus.PENDING)
    price: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    customer: Mapped["Customer"] = relationship(lazy="selectin")  # noqa: F821
    driver: Mapped["Driver | None"] = relationship(back_populates="jobs", lazy="selectin")  # noqa: F821
    pod: Mapped["ProofOfDelivery | None"] = relationship(  # noqa: F821
        back_populates="job", uselist=False, lazy="selectin",
    )

    __table_args__ = (
        Index("ix_jobs_tracking_id", "tracking_id"),
        Index("ix_jobs_status", "status"),
        Index("ix_jobs_created_at", "created_at"),
        Index("ix_jobs_driver_id", "driver_id"),
        Index("ix_jobs_customer_id", "customer_id"),
    )
