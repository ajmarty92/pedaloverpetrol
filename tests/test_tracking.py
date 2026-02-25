"""Tests for the public tracking endpoint."""

import uuid

import pytest
from httpx import AsyncClient

from src.models.customer import Customer
from src.models.driver import Driver

pytestmark = pytest.mark.asyncio


async def _create_and_get_job(client: AsyncClient, headers: dict, customer_id: uuid.UUID) -> dict:
    resp = await client.post(
        "/api/jobs",
        json={
            "customer_id": str(customer_id),
            "pickup_address": "10 Sender Rd",
            "dropoff_address": "20 Receiver Ln",
        },
        headers=headers,
    )
    assert resp.status_code == 201
    return resp.json()


class TestTrackingEndpoint:
    async def test_track_pending_job(
        self, client: AsyncClient, admin_headers: dict, customer: Customer,
    ):
        job = await _create_and_get_job(client, admin_headers, customer.id)
        resp = await client.get(f"/api/tracking/{job['tracking_id']}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["tracking_id"] == job["tracking_id"]
        assert data["status"] == "pending"
        assert data["pickup_address"] == "10 Sender Rd"
        assert data["dropoff_address"] == "20 Receiver Ln"
        assert data["driver_id"] is None
        assert "created_at" in data

    async def test_track_assigned_job_shows_driver(
        self,
        client: AsyncClient,
        admin_headers: dict,
        customer: Customer,
        driver: Driver,
    ):
        job = await _create_and_get_job(client, admin_headers, customer.id)
        await client.post(
            f"/api/jobs/{job['id']}/assign",
            json={"driver_id": str(driver.id)},
            headers=admin_headers,
        )
        resp = await client.get(f"/api/tracking/{job['tracking_id']}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "assigned"
        assert data["driver_id"] == str(driver.id)

    async def test_track_nonexistent_returns_404(self, client: AsyncClient):
        resp = await client.get("/api/tracking/DOESNOTEXIST")
        assert resp.status_code == 404

    async def test_tracking_is_public_no_auth_needed(
        self, client: AsyncClient, admin_headers: dict, customer: Customer,
    ):
        job = await _create_and_get_job(client, admin_headers, customer.id)
        resp = await client.get(f"/api/tracking/{job['tracking_id']}")
        assert resp.status_code == 200
