import uuid
from datetime import datetime

from pydantic import BaseModel

from src.jobs.models import JobStatus


class TrackingDriverSummary(BaseModel):
    id: uuid.UUID
    name: str
    current_lat: float | None
    current_lng: float | None
    last_location_update_at: datetime | None

    model_config = {"from_attributes": True}


class TrackingResponse(BaseModel):
    tracking_id: str
    status: JobStatus
    pickup_address: str
    dropoff_address: str
    created_at: datetime
    updated_at: datetime
    delivered_at: datetime | None
    driver: TrackingDriverSummary | None
