import uuid
from datetime import datetime

from pydantic import BaseModel


class PODBase(BaseModel):
    signed_by: str
    signature_url: str | None = None
    photo_url: str | None = None
    notes: str | None = None


class PODCreate(PODBase):
    job_id: uuid.UUID


class PODRead(PODBase):
    id: uuid.UUID
    job_id: uuid.UUID
    signed_at: datetime
    created_at: datetime

    model_config = {"from_attributes": True}
