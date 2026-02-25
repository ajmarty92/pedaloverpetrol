import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.dependencies import require_roles
from src.database import get_db
from src.jobs import service
from src.models.job import JobStatus
from src.models.user import User, UserRole
from src.schemas.job import JobAssign, JobCreate, JobListParams, JobRead, JobUpdate

router = APIRouter(prefix="/api/jobs", tags=["jobs"])

AdminOrDispatcher = Annotated[User, Depends(require_roles(UserRole.ADMIN, UserRole.DISPATCHER))]


@router.post("", response_model=JobRead, status_code=201)
async def create_job(
    body: JobCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _current_user: AdminOrDispatcher,
):
    job = await service.create_job(
        db,
        customer_id=body.customer_id,
        pickup_address=body.pickup_address,
        dropoff_address=body.dropoff_address,
        description=body.description,
        special_instructions=body.special_instructions,
    )
    return job


@router.get("", response_model=list[JobRead])
async def list_jobs(
    db: Annotated[AsyncSession, Depends(get_db)],
    _current_user: AdminOrDispatcher,
    status: JobStatus | None = Query(default=None),
    created_after: str | None = Query(default=None),
    created_before: str | None = Query(default=None),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
):
    from datetime import datetime

    after = datetime.fromisoformat(created_after) if created_after else None
    before = datetime.fromisoformat(created_before) if created_before else None
    return await service.list_jobs(
        db,
        status_filter=status,
        created_after=after,
        created_before=before,
        skip=skip,
        limit=limit,
    )


@router.get("/{job_id}", response_model=JobRead)
async def get_job(
    job_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _current_user: AdminOrDispatcher,
):
    return await service.get_job(db, job_id)


@router.patch("/{job_id}", response_model=JobRead)
async def update_job(
    job_id: uuid.UUID,
    body: JobUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _current_user: AdminOrDispatcher,
):
    kwargs: dict = {}
    if body.pickup_address is not None:
        kwargs["pickup_address"] = body.pickup_address
    if body.dropoff_address is not None:
        kwargs["dropoff_address"] = body.dropoff_address
    if body.status is not None:
        kwargs["new_status"] = body.status
    return await service.update_job(db, job_id, **kwargs)


@router.post("/{job_id}/assign", response_model=JobRead)
async def assign_job(
    job_id: uuid.UUID,
    body: JobAssign,
    db: Annotated[AsyncSession, Depends(get_db)],
    _current_user: AdminOrDispatcher,
):
    return await service.assign_job(db, job_id, body.driver_id)
