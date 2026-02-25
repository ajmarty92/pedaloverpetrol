import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from src.drivers.models import DriverStatus


class DriverCreate(BaseModel):
    user_id: uuid.UUID
    name: str = Field(min_length=1, max_length=255)
    phone: str = Field(min_length=1, max_length=50)
    vehicle_info: str | None = None


class DriverUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    phone: str | None = Field(default=None, min_length=1, max_length=50)
    vehicle_info: str | None = None
    status: DriverStatus | None = None


class DriverRead(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    phone: str
    vehicle_info: str | None
    status: DriverStatus
    current_lat: float | None
    current_lng: float | None
    last_location_update_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}
