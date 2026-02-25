import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.models import User
from src.drivers.models import Driver, DriverStatus


async def create_driver(
    db: AsyncSession,
    *,
    user_id: uuid.UUID,
    name: str,
    phone: str,
    vehicle_info: str | None = None,
) -> Driver:
    result = await db.execute(select(User).where(User.id == user_id))
    if result.scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    result = await db.execute(select(Driver).where(Driver.user_id == user_id))
    if result.scalar_one_or_none() is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Driver profile already exists for this user")

    driver = Driver(user_id=user_id, name=name, phone=phone, vehicle_info=vehicle_info)
    db.add(driver)
    await db.flush()
    await db.refresh(driver)
    return driver


async def get_driver(db: AsyncSession, driver_id: uuid.UUID) -> Driver:
    result = await db.execute(select(Driver).where(Driver.id == driver_id))
    driver = result.scalar_one_or_none()
    if driver is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found")
    return driver


async def list_drivers(
    db: AsyncSession, *, skip: int = 0, limit: int = 50,
) -> list[Driver]:
    query = select(Driver).order_by(Driver.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def update_driver(
    db: AsyncSession,
    driver_id: uuid.UUID,
    *,
    name: str | None = None,
    phone: str | None = None,
    vehicle_info: str | None = ...,  # type: ignore[assignment]
    new_status: DriverStatus | None = None,
) -> Driver:
    driver = await get_driver(db, driver_id)

    if name is not None:
        driver.name = name
    if phone is not None:
        driver.phone = phone
    if vehicle_info is not ...:
        driver.vehicle_info = vehicle_info
    if new_status is not None:
        driver.status = new_status

    await db.flush()
    await db.refresh(driver)
    return driver
