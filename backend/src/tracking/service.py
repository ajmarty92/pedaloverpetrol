from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.jobs.models import Job
from src.tracking.schemas import TrackingDriverSummary, TrackingResponse


async def get_tracking_info(db: AsyncSession, tracking_id: str) -> TrackingResponse:
    result = await db.execute(select(Job).where(Job.tracking_id == tracking_id))
    job = result.scalar_one_or_none()
    if job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tracking ID not found",
        )

    driver_summary = None
    if job.driver is not None:
        driver_summary = TrackingDriverSummary(
            id=job.driver.id,
            name=job.driver.name,
            current_lat=job.driver.current_lat,
            current_lng=job.driver.current_lng,
            last_location_update_at=job.driver.last_location_update_at,
        )

    delivered_at = None
    if job.pod is not None:
        delivered_at = job.pod.delivered_at

    return TrackingResponse(
        tracking_id=job.tracking_id,
        status=job.status,
        pickup_address=job.pickup_address,
        dropoff_address=job.dropoff_address,
        created_at=job.created_at,
        updated_at=job.updated_at,
        delivered_at=delivered_at,
        driver=driver_summary,
    )
