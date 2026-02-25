import uuid
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.dependencies import get_current_user
from src.auth.models import User
from src.db.session import get_db
from src.jobs import service
from src.jobs.models import JobStatus
from src.jobs.schemas import JobAssign, JobCreate, JobRead, JobUpdate

router = APIRouter(prefix="/api/jobs", tags=["jobs"])

AuthUser = Annotated[User, Depends(get_current_user)]


@router.post("", response_model=JobRead, status_code=201)
async def create_job(
    body: JobCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _user: AuthUser,
):
    return await service.create_job(
        db,
        customer_id=body.customer_id,
        pickup_address=body.pickup_address,
        dropoff_address=body.dropoff_address,
        price=body.price,
        notes=body.notes,
    )


@router.get("", response_model=list[JobRead])
async def list_jobs(
    db: Annotated[AsyncSession, Depends(get_db)],
    _user: AuthUser,
    status: JobStatus | None = Query(default=None),
    created_after: str | None = Query(default=None),
    created_before: str | None = Query(default=None),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
):
    after = datetime.fromisoformat(created_after) if created_after else None
    before = datetime.fromisoformat(created_before) if created_before else None
    return await service.list_jobs(
        db, status_filter=status, created_after=after, created_before=before,
        skip=skip, limit=limit,
    )


@router.get("/{job_id}", response_model=JobRead)
async def get_job(
    job_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _user: AuthUser,
):
    return await service.get_job(db, job_id)


@router.patch("/{job_id}", response_model=JobRead)
async def update_job(
    job_id: uuid.UUID,
    body: JobUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _user: AuthUser,
):
    kwargs: dict = {}
    if body.pickup_address is not None:
        kwargs["pickup_address"] = body.pickup_address
    if body.dropoff_address is not None:
        kwargs["dropoff_address"] = body.dropoff_address
    if body.status is not None:
        kwargs["new_status"] = body.status
    if body.price is not None:
        kwargs["price"] = body.price
    return await service.update_job(db, job_id, **kwargs)


@router.post("/{job_id}/assign", response_model=JobRead)
async def assign_job(
    job_id: uuid.UUID,
    body: JobAssign,
    db: Annotated[AsyncSession, Depends(get_db)],
    _user: AuthUser,
):
    return await service.assign_job(db, job_id, body.driver_id)
