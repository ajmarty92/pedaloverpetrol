from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.session import get_db
from src.tracking.schemas import TrackingResponse
from src.tracking.service import get_tracking_info

router = APIRouter(prefix="/api/tracking", tags=["tracking"])


@router.get("/{tracking_id}", response_model=TrackingResponse)
async def track_job(
    tracking_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await get_tracking_info(db, tracking_id)
