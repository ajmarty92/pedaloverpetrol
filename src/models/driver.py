import uuid

from sqlalchemy import ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base


class Driver(Base):
    __tablename__ = "drivers"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    vehicle_type: Mapped[str] = mapped_column(String(100), nullable=False)
    license_plate: Mapped[str] = mapped_column(String(50), nullable=True)
    is_available: Mapped[bool] = mapped_column(default=True)

    user: Mapped["User"] = relationship(back_populates="driver_profile", lazy="selectin")  # noqa: F821
    jobs: Mapped[list["Job"]] = relationship(back_populates="driver", lazy="selectin")  # noqa: F821

    __table_args__ = (
        Index("ix_drivers_user_id", "user_id"),
        Index("ix_drivers_is_available", "is_available"),
    )
