import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from src.models.job import JobStatus


class JobCreate(BaseModel):
    customer_id: uuid.UUID
    pickup_address: str = Field(min_length=1, max_length=500)
    dropoff_address: str = Field(min_length=1, max_length=500)
    description: str | None = None
    special_instructions: str | None = None


class JobUpdate(BaseModel):
    pickup_address: str | None = Field(default=None, min_length=1, max_length=500)
    dropoff_address: str | None = Field(default=None, min_length=1, max_length=500)
    description: str | None = None
    special_instructions: str | None = None
    status: JobStatus | None = None


class JobAssign(BaseModel):
    driver_id: uuid.UUID


class JobRead(BaseModel):
    id: uuid.UUID
    tracking_id: str
    status: JobStatus
    customer_id: uuid.UUID
    driver_id: uuid.UUID | None
    pickup_address: str
    dropoff_address: str
    description: str | None
    special_instructions: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class JobListParams(BaseModel):
    status: JobStatus | None = None
    created_after: datetime | None = None
    created_before: datetime | None = None
    skip: int = Field(default=0, ge=0)
    limit: int = Field(default=50, ge=1, le=200)


class TrackingResponse(BaseModel):
    tracking_id: str
    status: JobStatus
    pickup_address: str
    dropoff_address: str
    driver_id: uuid.UUID | None
    created_at: datetime

    model_config = {"from_attributes": True}
