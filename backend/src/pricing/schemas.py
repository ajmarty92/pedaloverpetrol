import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class PricingRuleCreate(BaseModel):
    rule_name: str = Field(min_length=1, max_length=255)
    base_rate: float = Field(ge=0)
    per_mile_rate: float = Field(ge=0, default=0)
    rush_surcharge: float = Field(ge=0, default=0)
    heavy_surcharge: float = Field(ge=0, default=0)
    zone_config: dict | None = None
    active: bool = True


class PricingRuleUpdate(BaseModel):
    rule_name: str | None = Field(default=None, min_length=1, max_length=255)
    base_rate: float | None = Field(default=None, ge=0)
    per_mile_rate: float | None = Field(default=None, ge=0)
    rush_surcharge: float | None = Field(default=None, ge=0)
    heavy_surcharge: float | None = Field(default=None, ge=0)
    zone_config: dict | None = None
    active: bool | None = None


class PricingRuleRead(BaseModel):
    id: uuid.UUID
    rule_name: str
    base_rate: float
    per_mile_rate: float
    rush_surcharge: float
    heavy_surcharge: float
    zone_config: dict | None
    active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class PriceQuoteRequest(BaseModel):
    distance_miles: float = Field(ge=0)
    is_rush: bool = False
    is_heavy: bool = False
    zone: str | None = None


class PriceQuoteResponse(BaseModel):
    rule_name: str
    base_rate: float
    distance_charge: float
    rush_surcharge: float
    heavy_surcharge: float
    zone_multiplier: float
    total: float
    breakdown: str
