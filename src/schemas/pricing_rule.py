import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel


class PricingRuleBase(BaseModel):
    name: str
    description: str | None = None
    base_rate: Decimal
    per_km_rate: Decimal = Decimal("0.00")
    per_kg_rate: Decimal = Decimal("0.00")


class PricingRuleCreate(PricingRuleBase):
    pass


class PricingRuleRead(PricingRuleBase):
    id: uuid.UUID
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
