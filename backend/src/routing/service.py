import uuid
from datetime import datetime, time, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.drivers.models import Driver
from src.jobs.models import Job, JobStatus
from src.routing.engine import (
    LatLng,
    Stop,
    address_to_synthetic_coords,
    solve_nearest_neighbor,
)
from src.routing.schemas import (
    ApplyRouteRequest,
    ApplyRouteResponse,
    OptimizedJobItem,
    OptimizeRouteResponse,
)

MAX_STOPS = 25
ACTIVE_STATUSES = {JobStatus.ASSIGNED, JobStatus.PICKED_UP}
ENGINE_NAME = "haversine_nearest_neighbor"


async def _get_driver(db: AsyncSession, driver_id: uuid.UUID) -> Driver:
    result = await db.execute(select(Driver).where(Driver.id == driver_id))
    driver = result.scalar_one_or_none()
    if driver is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found")
    return driver


async def _resolve_jobs(
    db: AsyncSession,
    driver_id: uuid.UUID,
    job_ids: list[uuid.UUID],
) -> list[Job]:
    if job_ids:
        result = await db.execute(
            select(Job).where(Job.id.in_(job_ids), Job.driver_id == driver_id)
        )
        jobs = list(result.scalars().all())
        found_ids = {j.id for j in jobs}
        missing = [str(jid) for jid in job_ids if jid not in found_ids]
        if missing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Jobs not found or not assigned to this driver: {', '.join(missing)}",
            )
        return jobs

    today_start = datetime.combine(datetime.now(timezone.utc).date(), time.min, tzinfo=timezone.utc)
    result = await db.execute(
        select(Job).where(
            Job.driver_id == driver_id,
            Job.status.in_(ACTIVE_STATUSES),
            Job.created_at >= today_start,
        )
    )
    return list(result.scalars().all())


async def optimize_route(
    db: AsyncSession,
    driver_id: uuid.UUID,
    job_ids: list[uuid.UUID],
) -> OptimizeRouteResponse:
    driver = await _get_driver(db, driver_id)
    jobs = await _resolve_jobs(db, driver_id, job_ids)

    if not jobs:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No active jobs found for this driver to optimize.",
        )
    if len(jobs) > MAX_STOPS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Too many stops ({len(jobs)}). Maximum is {MAX_STOPS}.",
        )

    stops = [
        Stop(
            id=str(j.id),
            pickup=address_to_synthetic_coords(j.pickup_address),
            dropoff=address_to_synthetic_coords(j.dropoff_address),
        )
        for j in jobs
    ]

    origin = None
    if driver.current_lat is not None and driver.current_lng is not None:
        origin = LatLng(lat=driver.current_lat, lng=driver.current_lng)

    result = solve_nearest_neighbor(stops, origin=origin)

    id_to_job = {str(j.id): j for j in jobs}
    optimized: list[OptimizedJobItem] = []
    for seq, jid in enumerate(result.ordered_ids, start=1):
        j = id_to_job[jid]
        optimized.append(
            OptimizedJobItem(
                sequence=seq,
                job_id=j.id,
                tracking_id=j.tracking_id,
                pickup_address=j.pickup_address,
                dropoff_address=j.dropoff_address,
                status=j.status,
            )
        )

    return OptimizeRouteResponse(
        driver_id=driver_id,
        optimized_jobs=optimized,
        total_distance_meters=result.total_distance_meters,
        total_duration_seconds=result.total_duration_seconds,
        engine=ENGINE_NAME,
    )


async def apply_route(
    db: AsyncSession,
    driver_id: uuid.UUID,
    body: ApplyRouteRequest,
) -> ApplyRouteResponse:
    await _get_driver(db, driver_id)

    job_ids = [item.job_id for item in body.sequence]
    result = await db.execute(
        select(Job).where(Job.id.in_(job_ids), Job.driver_id == driver_id)
    )
    jobs = {j.id: j for j in result.scalars().all()}

    missing = [str(jid) for jid in job_ids if jid not in jobs]
    if missing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Jobs not found or not assigned to this driver: {', '.join(missing)}",
        )

    for item in body.sequence:
        jobs[item.job_id].route_sequence = item.sequence

    await db.flush()
    return ApplyRouteResponse(applied=len(body.sequence))
