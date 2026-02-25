import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from src.jobs.models import JobStatus, PaymentStatus


class JobCreate(BaseModel):
    customer_id: uuid.UUID
    pickup_address: str = Field(min_length=1, max_length=500)
    dropoff_address: str = Field(min_length=1, max_length=500)
    price: float | None = None
    notes: str | None = None


class JobUpdate(BaseModel):
    pickup_address: str | None = Field(default=None, min_length=1, max_length=500)
    dropoff_address: str | None = Field(default=None, min_length=1, max_length=500)
    status: JobStatus | None = None
    price: float | None = None
    notes: str | None = None


class JobAssign(BaseModel):
    driver_id: uuid.UUID


class JobRead(BaseModel):
    id: uuid.UUID
    tracking_id: str
    customer_id: uuid.UUID
    driver_id: uuid.UUID | None
    pickup_address: str
    dropoff_address: str
    status: JobStatus
    price: float | None
    payment_status: PaymentStatus
    notes: str | None
    route_sequence: int | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
