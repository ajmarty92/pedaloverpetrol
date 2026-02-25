from sqlalchemy import JSON, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from src.db.base import Base


class PricingRule(Base):
    __tablename__ = "pricing_rules"

    rule_name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    base_rate: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    per_mile_rate: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    zone_config: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    active: Mapped[bool] = mapped_column(default=True)
