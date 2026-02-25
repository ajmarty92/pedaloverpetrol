"""Tests for the public tracking endpoint."""

import uuid

import pytest
from httpx import AsyncClient

from src.customers.models import Customer
from src.drivers.models import Driver

pytestmark = pytest.mark.asyncio


async def _create_job(client: AsyncClient, headers: dict, customer_id: uuid.UUID) -> dict:
    resp = await client.post(
        "/api/jobs",
        json={
            "customer_id": str(customer_id),
            "pickup_address": "10 Sender Road",
            "dropoff_address": "20 Receiver Lane",
        },
        headers=headers,
    )
    assert resp.status_code == 201
    return resp.json()


class TestTrackingEndpoint:
    async def test_track_pending_job(
        self, client: AsyncClient, admin_headers: dict, customer: Customer,
    ):
        job = await _create_job(client, admin_headers, customer.id)
        resp = await client.get(f"/api/tracking/{job['tracking_id']}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["tracking_id"] == job["tracking_id"]
        assert data["status"] == "pending"
        assert data["pickup_address"] == "10 Sender Road"
        assert data["dropoff_address"] == "20 Receiver Lane"
        assert data["driver"] is None
        assert data["delivered_at"] is None
        assert "created_at" in data
        assert "updated_at" in data

    async def test_track_assigned_job_includes_driver(
        self,
        client: AsyncClient,
        admin_headers: dict,
        customer: Customer,
        driver: Driver,
    ):
        job = await _create_job(client, admin_headers, customer.id)
        await client.post(
            f"/api/jobs/{job['id']}/assign",
            json={"driver_id": str(driver.id)},
            headers=admin_headers,
        )

        resp = await client.get(f"/api/tracking/{job['tracking_id']}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "assigned"
        assert data["driver"] is not None
        assert data["driver"]["id"] == str(driver.id)
        assert data["driver"]["name"] == "Test Driver"
        assert data["driver"]["current_lat"] is None
        assert data["driver"]["current_lng"] is None

    async def test_track_nonexistent_returns_404(self, client: AsyncClient):
        resp = await client.get("/api/tracking/DOESNOTEXIST")
        assert resp.status_code == 404

    async def test_tracking_is_public_no_auth(
        self, client: AsyncClient, admin_headers: dict, customer: Customer,
    ):
        job = await _create_job(client, admin_headers, customer.id)
        resp = await client.get(f"/api/tracking/{job['tracking_id']}")
        assert resp.status_code == 200

    async def test_tracking_does_not_expose_sensitive_fields(
        self, client: AsyncClient, admin_headers: dict, customer: Customer,
    ):
        job = await _create_job(client, admin_headers, customer.id)
        resp = await client.get(f"/api/tracking/{job['tracking_id']}")
        data = resp.json()
        assert "customer_id" not in data
        assert "price" not in data
        assert "notes" not in data
        assert "id" not in data
