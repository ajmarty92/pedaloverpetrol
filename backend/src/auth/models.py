import enum

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from src.db.base import Base


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    DISPATCHER = "dispatcher"
    DRIVER = "driver"


class User(Base):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(nullable=False, index=True)
    is_active: Mapped[bool] = mapped_column(default=True)
