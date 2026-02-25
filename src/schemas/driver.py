import uuid
from datetime import datetime

from pydantic import BaseModel


class DriverBase(BaseModel):
    vehicle_type: str
    license_plate: str | None = None


class DriverCreate(DriverBase):
    user_id: uuid.UUID


class DriverRead(DriverBase):
    id: uuid.UUID
    user_id: uuid.UUID
    is_available: bool
    created_at: datetime

    model_config = {"from_attributes": True}
