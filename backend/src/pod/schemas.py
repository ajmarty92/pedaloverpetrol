import uuid
from datetime import datetime

from pydantic import BaseModel


class PODCreate(BaseModel):
    recipient_name: str
    signature_url: str | None = None
    photo_urls: list[str] | None = None
    gps_lat: float | None = None
    gps_lng: float | None = None


class PODRead(BaseModel):
    id: uuid.UUID
    job_id: uuid.UUID
    recipient_name: str
    signature_url: str | None
    photo_urls: list[str] | None
    delivered_at: datetime
    gps_lat: float | None
    gps_lng: float | None
    created_at: datetime

    model_config = {"from_attributes": True}
