import uuid

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from src.auth.models import User, UserRole
from src.core.security import create_access_token, hash_password
from src.customers.models import Customer
from src.db import Base
from src.db.session import get_db
from src.drivers.models import Driver

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
    factory = async_sessionmaker(db_engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        yield session


@pytest_asyncio.fixture()
async def client(db_engine):
    from main import app

    factory = async_sessionmaker(db_engine, class_=AsyncSession, expire_on_commit=False)

    async def _override_get_db():
        async with factory() as session:
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
        password_hash=hash_password("adminpass123"),
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
    cust = Customer(id=uuid.uuid4(), name="Test Corp", phone="555-0100", email="test@corp.com")
    db_session.add(cust)
    await db_session.commit()
    await db_session.refresh(cust)
    return cust


@pytest_asyncio.fixture()
async def driver_user(db_session: AsyncSession) -> User:
    user = User(
        id=uuid.uuid4(),
        email="driver@test.com",
        password_hash=hash_password("driverpass123"),
        role=UserRole.DRIVER,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture()
async def driver(db_session: AsyncSession, driver_user: User) -> Driver:
    drv = Driver(
        id=uuid.uuid4(), user_id=driver_user.id, name="Test Driver",
        phone="555-0200", vehicle_info="Cargo bike",
    )
    db_session.add(drv)
    await db_session.commit()
    await db_session.refresh(drv)
    return drv
