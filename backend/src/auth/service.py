import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.models import User, UserRole
from src.core.security import create_access_token, create_refresh_token, hash_password, verify_password


async def register_user(
    db: AsyncSession,
    *,
    email: str,
    password: str,
    role: UserRole,
) -> User:
    result = await db.execute(select(User).where(User.email == email))
    if result.scalar_one_or_none() is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = User(
        email=email,
        password_hash=hash_password(password),
        role=role,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user


async def authenticate_user(db: AsyncSession, *, email: str, password: str) -> dict:
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if user is None or not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled")

    return {
        "access_token": create_access_token(str(user.id), user.role.value),
        "refresh_token": create_refresh_token(str(user.id)),
        "token_type": "bearer",
    }
