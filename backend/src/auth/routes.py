from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth import service
from src.auth.dependencies import require_roles
from src.auth.models import User, UserRole
from src.auth.schemas import LoginRequest, RegisterRequest, TokenResponse, UserRead
from src.db.session import get_db

router = APIRouter(prefix="/api/auth", tags=["auth"])

AdminOnly = Annotated[User, Depends(require_roles(UserRole.ADMIN))]


@router.post("/register", response_model=UserRead, status_code=201)
async def register(
    body: RegisterRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    _admin: AdminOnly,
):
    user = await service.register_user(db, email=body.email, password=body.password, role=body.role)
    return user


@router.post("/login", response_model=TokenResponse)
async def login(
    body: LoginRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await service.authenticate_user(db, email=body.email, password=body.password)
