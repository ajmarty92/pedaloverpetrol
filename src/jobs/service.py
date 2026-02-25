import secrets
import string
import uuid
from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.customer import Customer
from src.models.driver import Driver
from src.models.job import Job, JobStatus

ALLOWED_TRANSITIONS: dict[JobStatus, set[JobStatus]] = {
    JobStatus.PENDING: {JobStatus.ASSIGNED},
    JobStatus.ASSIGNED: {JobStatus.PICKED_UP},
    JobStatus.PICKED_UP: {JobStatus.IN_TRANSIT},
    JobStatus.IN_TRANSIT: {JobStatus.DELIVERED, JobStatus.FAILED},
}


def validate_transition(current: JobStatus, target: JobStatus) -> None:
    allowed = ALLOWED_TRANSITIONS.get(current, set())
    if target not in allowed:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Invalid status transition: '{current.value}' → '{target.value}'. "
                f"Allowed transitions from '{current.value}': "
                f"{sorted(s.value for s in allowed) if allowed else 'none (terminal state)'}."
            ),
        )


def _generate_tracking_id(length: int = 12) -> str:
    alphabet = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


async def create_job(
    db: AsyncSession,
    *,
    customer_id: uuid.UUID,
    pickup_address: str,
    dropoff_address: str,
    description: str | None = None,
    special_instructions: str | None = None,
) -> Job:
    result = await db.execute(select(Customer).where(Customer.id == customer_id))
    if result.scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")

    job = Job(
        tracking_id=_generate_tracking_id(),
        customer_id=customer_id,
        pickup_address=pickup_address,
        dropoff_address=dropoff_address,
        description=description,
        special_instructions=special_instructions,
        status=JobStatus.PENDING,
    )
    db.add(job)
    await db.flush()
    await db.refresh(job)
    return job


async def get_job(db: AsyncSession, job_id: uuid.UUID) -> Job:
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if job is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    return job


async def list_jobs(
    db: AsyncSession,
    *,
    status_filter: JobStatus | None = None,
    created_after: datetime | None = None,
    created_before: datetime | None = None,
    skip: int = 0,
    limit: int = 50,
) -> list[Job]:
    query = select(Job)
    if status_filter is not None:
        query = query.where(Job.status == status_filter)
    if created_after is not None:
        query = query.where(Job.created_at >= created_after)
    if created_before is not None:
        query = query.where(Job.created_at <= created_before)
    query = query.order_by(Job.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def update_job(
    db: AsyncSession,
    job_id: uuid.UUID,
    *,
    pickup_address: str | None = None,
    dropoff_address: str | None = None,
    description: str | None = ...,  # type: ignore[assignment]
    special_instructions: str | None = ...,  # type: ignore[assignment]
    new_status: JobStatus | None = None,
) -> Job:
    job = await get_job(db, job_id)

    if new_status is not None:
        validate_transition(job.status, new_status)
        job.status = new_status

    if pickup_address is not None:
        job.pickup_address = pickup_address
    if dropoff_address is not None:
        job.dropoff_address = dropoff_address
    if description is not ...:
        job.description = description
    if special_instructions is not ...:
        job.special_instructions = special_instructions

    await db.flush()
    await db.refresh(job)
    return job


async def assign_job(db: AsyncSession, job_id: uuid.UUID, driver_id: uuid.UUID) -> Job:
    job = await get_job(db, job_id)

    validate_transition(job.status, JobStatus.ASSIGNED)

    result = await db.execute(select(Driver).where(Driver.id == driver_id))
    driver = result.scalar_one_or_none()
    if driver is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found")

    job.driver_id = driver_id
    job.status = JobStatus.ASSIGNED
    await db.flush()
    await db.refresh(job)
    return job


async def get_job_by_tracking_id(db: AsyncSession, tracking_id: str) -> Job:
    result = await db.execute(select(Job).where(Job.tracking_id == tracking_id))
    job = result.scalar_one_or_none()
    if job is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tracking ID not found")
    return job
