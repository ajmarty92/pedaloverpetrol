import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.dependencies import get_current_user
from src.auth.models import User
from src.db.session import get_db
from src.drivers import service
from src.drivers.schemas import DriverCreate, DriverRead, DriverUpdate

router = APIRouter(prefix="/api/drivers", tags=["drivers"])

AuthUser = Annotated[User, Depends(get_current_user)]


@router.post("", response_model=DriverRead, status_code=201)
async def create_driver(
    body: DriverCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _user: AuthUser,
):
    return await service.create_driver(
        db, user_id=body.user_id, name=body.name, phone=body.phone,
        vehicle_info=body.vehicle_info,
    )


@router.get("", response_model=list[DriverRead])
async def list_drivers(
    db: Annotated[AsyncSession, Depends(get_db)],
    _user: AuthUser,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
):
    return await service.list_drivers(db, skip=skip, limit=limit)


@router.get("/{driver_id}", response_model=DriverRead)
async def get_driver(
    driver_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _user: AuthUser,
):
    return await service.get_driver(db, driver_id)


@router.patch("/{driver_id}", response_model=DriverRead)
async def update_driver(
    driver_id: uuid.UUID,
    body: DriverUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _user: AuthUser,
):
    kwargs: dict = {}
    if body.name is not None:
        kwargs["name"] = body.name
    if body.phone is not None:
        kwargs["phone"] = body.phone
    if body.status is not None:
        kwargs["new_status"] = body.status
    return await service.update_driver(db, driver_id, **kwargs)
