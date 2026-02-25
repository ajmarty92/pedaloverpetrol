import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Index, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.db.base import Base


class DriverStatus(str, enum.Enum):
    ON_DUTY = "on_duty"
    OFF_DUTY = "off_duty"


class Driver(Base):
    __tablename__ = "drivers"

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"),
        unique=True, nullable=False,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str] = mapped_column(String(50), nullable=False)
    vehicle_info: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[DriverStatus] = mapped_column(default=DriverStatus.OFF_DUTY)

    current_lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    current_lng: Mapped[float | None] = mapped_column(Float, nullable=True)
    last_location_update_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True,
    )

    user: Mapped["User"] = relationship(lazy="selectin")  # noqa: F821
    jobs: Mapped[list["Job"]] = relationship(back_populates="driver", lazy="selectin")  # noqa: F821

    __table_args__ = (
        Index("ix_drivers_user_id", "user_id"),
        Index("ix_drivers_status", "status"),
    )
