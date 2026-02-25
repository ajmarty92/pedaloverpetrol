import uuid
from datetime import date

from pydantic import BaseModel


class AnalyticsSummary(BaseModel):
    jobs_total: int
    jobs_delivered: int
    jobs_failed: int
    jobs_active: int
    on_time_rate: float
    avg_delivery_time_minutes: float | None


class DayBucket(BaseModel):
    date: date
    jobs_total: int
    jobs_delivered: int
    jobs_failed: int


class ByDayResponse(BaseModel):
    range_days: int
    buckets: list[DayBucket]


class DriverPerformance(BaseModel):
    driver_id: uuid.UUID
    driver_name: str
    jobs_completed: int
    jobs_failed: int
    on_time_rate: float

    model_config = {"from_attributes": True}


class ByDriverResponse(BaseModel):
    range_days: int
    drivers: list[DriverPerformance]
