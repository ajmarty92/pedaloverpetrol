from sqlalchemy import Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base


class Customer(Base):
    __tablename__ = "customers"

    company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    contact_name: Mapped[str] = mapped_column(String(255), nullable=False)
    contact_email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    contact_phone: Mapped[str] = mapped_column(String(50), nullable=True)

    jobs: Mapped[list["Job"]] = relationship(back_populates="customer", lazy="selectin")  # noqa: F821

    __table_args__ = (
        Index("ix_customers_contact_email", "contact_email"),
    )
