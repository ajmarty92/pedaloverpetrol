from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import get_db
from src.jobs.service import get_job_by_tracking_id
from src.schemas.job import TrackingResponse

router = APIRouter(prefix="/api/tracking", tags=["tracking"])


@router.get("/{tracking_id}", response_model=TrackingResponse)
async def track_job(
    tracking_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    job = await get_job_by_tracking_id(db, tracking_id)
    return TrackingResponse(
        tracking_id=job.tracking_id,
        status=job.status,
        pickup_address=job.pickup_address,
        dropoff_address=job.dropoff_address,
        driver_id=job.driver_id,
        created_at=job.created_at,
    )
