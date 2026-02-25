from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.analytics import service
from src.analytics.schemas import AnalyticsSummary, ByDayResponse, ByDriverResponse
from src.auth.dependencies import get_current_user
from src.auth.models import User
from src.db.session import get_db

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

AuthUser = Annotated[User, Depends(get_current_user)]

ALLOWED_RANGES = {7, 14, 30, 90}


def _parse_range(raw: str) -> int:
    stripped = raw.rstrip("d")
    try:
        days = int(stripped)
    except ValueError:
        days = 30
    return days if days in ALLOWED_RANGES else 30


@router.get("/summary", response_model=AnalyticsSummary)
async def summary(
    db: Annotated[AsyncSession, Depends(get_db)],
    _user: AuthUser,
    range: str = Query(default="30d", description="Time range, e.g. 7d, 30d, 90d"),
):
    return await service.get_summary(db, _parse_range(range))


@router.get("/by-day", response_model=ByDayResponse)
async def by_day(
    db: Annotated[AsyncSession, Depends(get_db)],
    _user: AuthUser,
    range: str = Query(default="30d"),
):
    return await service.get_by_day(db, _parse_range(range))


@router.get("/by-driver", response_model=ByDriverResponse)
async def by_driver(
    db: Annotated[AsyncSession, Depends(get_db)],
    _user: AuthUser,
    range: str = Query(default="30d"),
):
    return await service.get_by_driver(db, _parse_range(range))
