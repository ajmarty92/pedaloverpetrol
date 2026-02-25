import uuid
from datetime import datetime

from pydantic import BaseModel

from src.jobs.models import JobStatus, PaymentStatus


class CustomerLoginRequest(BaseModel):
    email: str
    password: str


class CustomerTokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    customer_name: str


class CustomerJobRead(BaseModel):
    id: uuid.UUID
    tracking_id: str
    pickup_address: str
    dropoff_address: str
    status: JobStatus
    price: float | None
    payment_status: PaymentStatus
    notes: str | None
    created_at: datetime
    updated_at: datetime
    delivered_at: datetime | None
    has_pod: bool

    model_config = {"from_attributes": True}


class PODRead(BaseModel):
    id: uuid.UUID
    job_id: uuid.UUID
    recipient_name: str
    signature_url: str | None
    photo_urls: list[str] | None
    delivered_at: datetime
    gps_lat: float | None
    gps_lng: float | None

    model_config = {"from_attributes": True}


class InvoiceRead(BaseModel):
    job_id: uuid.UUID
    tracking_id: str
    customer_name: str
    pickup_address: str
    dropoff_address: str
    status: str
    price: float | None
    created_at: datetime
    delivered_at: datetime | None
