import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy import JSON

from src.db.base import Base


class ProofOfDelivery(Base):
    __tablename__ = "pods"

    job_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("jobs.id", ondelete="CASCADE"),
        unique=True, nullable=False,
    )
    signature_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    photo_urls: Mapped[list | None] = mapped_column(JSON, nullable=True)
    recipient_name: Mapped[str] = mapped_column(String(255), nullable=False)
    delivered_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
    )
    gps_lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    gps_lng: Mapped[float | None] = mapped_column(Float, nullable=True)

    job: Mapped["Job"] = relationship(back_populates="pod", lazy="selectin")  # noqa: F821
