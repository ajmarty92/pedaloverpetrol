import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr

from src.models.user import UserRole


class UserBase(BaseModel):
    email: str
    full_name: str
    role: UserRole


class UserCreate(UserBase):
    password: str


class UserRead(UserBase):
    id: uuid.UUID
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
