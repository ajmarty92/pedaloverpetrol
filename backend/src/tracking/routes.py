from typing import Annotated

from fastapi import APIRouter, Depends, Path, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.session import get_db
from src.tracking.schemas import TrackingResponse
from src.tracking.service import get_tracking_info

router = APIRouter(prefix="/api/tracking", tags=["tracking"])
limiter = Limiter(key_func=get_remote_address)


@router.get("/{tracking_id}", response_model=TrackingResponse)
@limiter.limit("30/minute")
async def track_job(
    request: Request,
    tracking_id: str = Path(min_length=1, max_length=20),
    db: AsyncSession = Depends(get_db),
):
    return await get_tracking_info(db, tracking_id)
