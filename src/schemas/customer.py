import uuid
from datetime import datetime

from pydantic import BaseModel


class CustomerBase(BaseModel):
    company_name: str
    contact_name: str
    contact_email: str
    contact_phone: str | None = None


class CustomerCreate(CustomerBase):
    pass


class CustomerRead(CustomerBase):
    id: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}
