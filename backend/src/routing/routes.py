import uuid
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.dependencies import get_current_user
from src.auth.models import User
from src.db.session import get_db
from src.routing import service
from src.routing.schemas import (
    ApplyRouteRequest,
    ApplyRouteResponse,
    OptimizeRouteRequest,
    OptimizeRouteResponse,
)

router = APIRouter(prefix="/api/drivers", tags=["routing"])

AuthUser = Annotated[User, Depends(get_current_user)]


@router.post(
    "/{driver_id}/optimize-route",
    response_model=OptimizeRouteResponse,
)
async def optimize_route(
    driver_id: uuid.UUID,
    body: OptimizeRouteRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    _user: AuthUser,
):
    return await service.optimize_route(db, driver_id, body.job_ids)


@router.post(
    "/{driver_id}/apply-route",
    response_model=ApplyRouteResponse,
)
async def apply_route(
    driver_id: uuid.UUID,
    body: ApplyRouteRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    _user: AuthUser,
):
    return await service.apply_route(db, driver_id, body)
