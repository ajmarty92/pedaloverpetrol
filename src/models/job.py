import enum
import uuid

from sqlalchemy import DateTime, ForeignKey, Index, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base


class JobStatus(str, enum.Enum):
    PENDING = "pending"
    ASSIGNED = "assigned"
    PICKED_UP = "picked_up"
    IN_TRANSIT = "in_transit"
    DELIVERED = "delivered"
    FAILED = "failed"


class Job(Base):
    __tablename__ = "jobs"

    tracking_id: Mapped[str] = mapped_column(
        String(20), unique=True, nullable=False,
    )
    status: Mapped[JobStatus] = mapped_column(default=JobStatus.PENDING)

    customer_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("customers.id", ondelete="RESTRICT"), nullable=False,
    )
    driver_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("drivers.id", ondelete="SET NULL"), nullable=True,
    )

    pickup_address: Mapped[str] = mapped_column(String(500), nullable=False)
    dropoff_address: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    special_instructions: Mapped[str | None] = mapped_column(Text, nullable=True)

    customer: Mapped["Customer"] = relationship(back_populates="jobs", lazy="selectin")  # noqa: F821
    driver: Mapped["Driver | None"] = relationship(back_populates="jobs", lazy="selectin")  # noqa: F821
    pod: Mapped["POD | None"] = relationship(back_populates="job", uselist=False, lazy="selectin")  # noqa: F821

    __table_args__ = (
        Index("ix_jobs_status", "status"),
        Index("ix_jobs_created_at", "created_at"),
        Index("ix_jobs_driver_id", "driver_id"),
        Index("ix_jobs_customer_id", "customer_id"),
        Index("ix_jobs_tracking_id", "tracking_id"),
    )
