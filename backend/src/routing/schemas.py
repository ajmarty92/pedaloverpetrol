"""Request / response schemas for the route-optimization endpoints.

POST /api/drivers/{driver_id}/optimize-route
--------------------------------------------
Request body (optional):
    { "job_ids": ["uuid", ...] }
    If omitted or empty, uses all active (assigned/picked_up) jobs for the driver.

Response:
    {
      "driver_id": "uuid",
      "optimized_jobs": [
        {
          "sequence": 1,
          "job_id":   "uuid",
          "tracking_id": "A3K9...",
          "pickup_address": "...",
          "dropoff_address": "...",
          "status": "assigned"
        }
      ],
      "total_distance_meters": 12400,
      "total_duration_seconds": 2280,
      "engine": "haversine_nearest_neighbor"
    }

POST /api/drivers/{driver_id}/apply-route
------------------------------------------
Request body:
    { "sequence": [{"job_id": "uuid", "sequence": 1}, ...] }

Limitations:
    - Maximum 25 stops per optimization request.
    - The built-in engine uses haversine straight-line distance (no road network).
      Replace with a Google Directions / OSRM adapter for production accuracy.
    - Addresses are geocoded with a simple deterministic hash to synthetic coords
      when real geocoding is not configured.  This keeps the system functional
      without an external API key while clearly surfacing estimated values.
"""

import uuid

from pydantic import BaseModel, Field

from src.jobs.models import JobStatus


class OptimizeRouteRequest(BaseModel):
    job_ids: list[uuid.UUID] = Field(default_factory=list)


class OptimizedJobItem(BaseModel):
    sequence: int
    job_id: uuid.UUID
    tracking_id: str
    pickup_address: str
    dropoff_address: str
    status: JobStatus

    model_config = {"from_attributes": True}


class OptimizeRouteResponse(BaseModel):
    driver_id: uuid.UUID
    optimized_jobs: list[OptimizedJobItem]
    total_distance_meters: float
    total_duration_seconds: float
    engine: str


class ApplyRouteItem(BaseModel):
    job_id: uuid.UUID
    sequence: int = Field(ge=1)


class ApplyRouteRequest(BaseModel):
    sequence: list[ApplyRouteItem] = Field(min_length=1)


class ApplyRouteResponse(BaseModel):
    applied: int
