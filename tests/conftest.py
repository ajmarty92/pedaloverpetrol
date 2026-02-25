import uuid
from datetime import datetime, timezone

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from src.auth.utils import create_access_token
from src.database import get_db
from src.main import app
from src.models import Base
from src.models.customer import Customer
from src.models.driver import Driver
from src.models.user import User, UserRole

TEST_DB_URL = "sqlite+aiosqlite:///:memory:"


@pytest_asyncio.fixture()
async def db_engine():
    engine = create_async_engine(TEST_DB_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture()
async def db_session(db_engine):
    session_factory = async_sessionmaker(db_engine, class_=AsyncSession, expire_on_commit=False)
    async with session_factory() as session:
        yield session


@pytest_asyncio.fixture()
async def client(db_engine):
    session_factory = async_sessionmaker(db_engine, class_=AsyncSession, expire_on_commit=False)

    async def _override_get_db():
        async with session_factory() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    app.dependency_overrides[get_db] = _override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest_asyncio.fixture()
async def admin_user(db_session: AsyncSession) -> User:
    user = User(
        id=uuid.uuid4(),
        email="admin@test.com",
        hashed_password="hashed",
        full_name="Admin User",
        role=UserRole.ADMIN,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture()
def admin_token(admin_user: User) -> str:
    return create_access_token(str(admin_user.id), admin_user.role.value)


@pytest_asyncio.fixture()
def admin_headers(admin_token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {admin_token}"}


@pytest_asyncio.fixture()
async def customer(db_session: AsyncSession) -> Customer:
    cust = Customer(
        id=uuid.uuid4(),
        company_name="Test Corp",
        contact_name="Jane Doe",
        contact_email="jane@testcorp.com",
    )
    db_session.add(cust)
    await db_session.commit()
    await db_session.refresh(cust)
    return cust


@pytest_asyncio.fixture()
async def driver_user(db_session: AsyncSession) -> User:
    user = User(
        id=uuid.uuid4(),
        email="driver@test.com",
        hashed_password="hashed",
        full_name="Driver User",
        role=UserRole.DRIVER,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture()
async def driver(db_session: AsyncSession, driver_user: User) -> Driver:
    drv = Driver(
        id=uuid.uuid4(),
        user_id=driver_user.id,
        vehicle_type="bicycle",
    )
    db_session.add(drv)
    await db_session.commit()
    await db_session.refresh(drv)
    return drv
