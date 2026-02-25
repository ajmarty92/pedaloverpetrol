from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column

from src.db.base import Base


class Customer(Base):
    __tablename__ = "customers"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    default_address: Mapped[str | None] = mapped_column(String(500), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
