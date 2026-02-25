import uuid

import pytest
from httpx import AsyncClient

from src.auth.models import User

pytestmark = pytest.mark.asyncio


class TestLogin:
    async def test_login_success(self, client: AsyncClient, admin_user: User):
        resp = await client.post(
            "/api/auth/login",
            json={"email": "admin@test.com", "password": "adminpass123"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    async def test_login_wrong_password(self, client: AsyncClient, admin_user: User):
        resp = await client.post(
            "/api/auth/login",
            json={"email": "admin@test.com", "password": "wrong"},
        )
        assert resp.status_code == 401

    async def test_login_unknown_email(self, client: AsyncClient):
        resp = await client.post(
            "/api/auth/login",
            json={"email": "nobody@test.com", "password": "whatever"},
        )
        assert resp.status_code == 401


class TestRegister:
    async def test_register_as_admin(self, client: AsyncClient, admin_headers: dict):
        resp = await client.post(
            "/api/auth/register",
            json={"email": "new@test.com", "password": "newpass1234", "role": "dispatcher"},
            headers=admin_headers,
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["email"] == "new@test.com"
        assert data["role"] == "dispatcher"

    async def test_register_duplicate_email(self, client: AsyncClient, admin_headers: dict, admin_user: User):
        resp = await client.post(
            "/api/auth/register",
            json={"email": "admin@test.com", "password": "newpass1234", "role": "dispatcher"},
            headers=admin_headers,
        )
        assert resp.status_code == 409

    async def test_register_unauthenticated_rejected(self, client: AsyncClient):
        resp = await client.post(
            "/api/auth/register",
            json={"email": "anon@test.com", "password": "newpass1234", "role": "driver"},
        )
        assert resp.status_code == 403

    async def test_register_non_admin_rejected(self, client: AsyncClient, driver_user: User):
        from src.core.security import create_access_token

        token = create_access_token(str(driver_user.id), driver_user.role.value)
        resp = await client.post(
            "/api/auth/register",
            json={"email": "another@test.com", "password": "newpass1234", "role": "driver"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 403
