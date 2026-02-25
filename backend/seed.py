"""Seed script — populates the database with realistic test data.

Usage:
    python3 seed.py          (requires DATABASE_URL in .env or environment)
    make seed                (shortcut via Makefile)

Idempotent: checks for existing records by email before inserting.
"""

import asyncio
import random
import secrets
import string
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.models import User, UserRole
from src.core.security import hash_password
from src.customers.models import Customer
from src.db.session import async_session_factory
from src.drivers.models import Driver, DriverStatus
from src.jobs.models import Job, JobStatus, PaymentStatus
from src.pod.models import ProofOfDelivery
from src.pricing.models import PricingRule

# ---------------------------------------------------------------------------
# Data
# ---------------------------------------------------------------------------

ADMIN = {"email": "admin@pedaloverpetrol.com", "password": "admin123", "role": UserRole.ADMIN}
DISPATCHER = {"email": "dispatch@pedaloverpetrol.com", "password": "dispatch123", "role": UserRole.DISPATCHER}

DRIVERS = [
    {"email": "driver.james@pedaloverpetrol.com", "password": "driver123", "name": "James Carter", "phone": "+44 7700 100001", "vehicle": "Cargo bicycle", "lat": 51.5074, "lng": -0.1278},
    {"email": "driver.aisha@pedaloverpetrol.com", "password": "driver123", "name": "Aisha Okonkwo", "phone": "+44 7700 100002", "vehicle": "Electric cargo bike", "lat": 51.5155, "lng": -0.1419},
    {"email": "driver.tom@pedaloverpetrol.com", "password": "driver123", "name": "Tom Brennan", "phone": "+44 7700 100003", "vehicle": "Bicycle + trailer", "lat": 51.5225, "lng": -0.0853},
]

CUSTOMERS = [
    {"name": "Brick & Mortar Coffee", "phone": "+44 20 7946 0001", "email": "orders@brickcoffee.co.uk", "address": "42 Shoreditch High St, London E1 6JE", "notes": "Side entrance for large deliveries"},
    {"name": "Thames Valley Legal", "phone": "+44 20 7946 0002", "email": "logistics@tvlegal.co.uk", "address": "1 Canada Square, Canary Wharf, London E14 5AB", "notes": "Reception desk, Floor 12"},
    {"name": "GreenLeaf Organics", "phone": "+44 20 7946 0003", "email": "hello@greenleaf.co.uk", "address": "88 Borough High St, London SE1 1LL", "notes": "Fragile items — handle with care"},
]

CUSTOMER_PORTAL_USER = {
    "email": "portal@brickcoffee.co.uk",
    "password": "customer123",
}

PICKUP_ADDRESSES = [
    "15 Clerkenwell Rd, London EC1M 5RD",
    "200 Pentonville Rd, London N1 9JP",
    "47 Whitechapel Rd, London E1 1DU",
    "33 Southwark Bridge Rd, London SE1 9HH",
    "8 Kingsland Rd, London E2 8DA",
    "120 Holborn, London EC1N 2TD",
    "55 Broadway Market, London E8 4PH",
    "12 Old Street, London EC1V 9BD",
]

DROPOFF_ADDRESSES = [
    "42 Shoreditch High St, London E1 6JE",
    "1 Canada Square, Canary Wharf, London E14 5AB",
    "88 Borough High St, London SE1 1LL",
    "25 Savile Row, London W1S 2ER",
    "10 Downing St, London SW1A 2AA",
    "221B Baker St, London NW1 6XE",
    "30 St Mary Axe, London EC3A 8BF",
    "1 Pudding Lane, London EC3R 8AB",
]

RECIPIENT_NAMES = [
    "Sarah Mitchell", "David Okafor", "Emma Thompson", "Raj Patel",
    "Lucy Chen", "Mark Williams", "Priya Sharma", "Oliver Hughes",
]

JOB_NOTES = [
    "Fragile — glass items inside",
    "Leave with reception if no answer",
    "Call on arrival",
    "Time-sensitive legal documents",
    "Heavy box — approx 15kg",
    None, None, None,
]


def _tracking_id() -> str:
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=12))


def _random_price() -> float:
    return round(random.uniform(8.0, 65.0), 2)


def _past_datetime(days_ago_max: int = 14) -> datetime:
    delta = timedelta(
        days=random.randint(0, days_ago_max),
        hours=random.randint(6, 20),
        minutes=random.randint(0, 59),
    )
    return datetime.now(timezone.utc) - delta


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _get_or_create_user(session: AsyncSession, email: str, password: str, role: UserRole) -> User:
    result = await session.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if user:
        return user
    user = User(id=uuid.uuid4(), email=email, password_hash=hash_password(password), role=role)
    session.add(user)
    await session.flush()
    return user


async def _get_or_create_customer(session: AsyncSession, name: str, **kwargs) -> Customer:
    result = await session.execute(select(Customer).where(Customer.name == name))
    cust = result.scalar_one_or_none()
    if cust:
        return cust
    cust = Customer(id=uuid.uuid4(), name=name, **kwargs)
    session.add(cust)
    await session.flush()
    return cust


async def _get_or_create_driver(session: AsyncSession, user: User, **kwargs) -> Driver:
    result = await session.execute(select(Driver).where(Driver.user_id == user.id))
    drv = result.scalar_one_or_none()
    if drv:
        return drv
    drv = Driver(id=uuid.uuid4(), user_id=user.id, status=DriverStatus.ON_DUTY, **kwargs)
    session.add(drv)
    await session.flush()
    return drv


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

async def seed():
    async with async_session_factory() as session:
        print("Seeding database…\n")

        # ── Users ──────────────────────────────────────────────
        admin = await _get_or_create_user(session, ADMIN["email"], ADMIN["password"], ADMIN["role"])
        dispatcher = await _get_or_create_user(session, DISPATCHER["email"], DISPATCHER["password"], DISPATCHER["role"])

        driver_records: list[Driver] = []
        for d in DRIVERS:
            user = await _get_or_create_user(session, d["email"], d["password"], UserRole.DRIVER)
            drv = await _get_or_create_driver(
                session, user,
                name=d["name"], phone=d["phone"], vehicle_info=d["vehicle"],
                current_lat=d["lat"], current_lng=d["lng"],
                last_location_update_at=datetime.now(timezone.utc),
            )
            driver_records.append(drv)

        # ── Customers ─────────────────────────────────────────
        customer_records: list[Customer] = []
        for i, c in enumerate(CUSTOMERS):
            kwargs: dict = {
                "phone": c["phone"], "email": c["email"],
                "default_address": c["address"], "notes": c["notes"],
            }
            if i == 0:
                portal_user = await _get_or_create_user(
                    session, CUSTOMER_PORTAL_USER["email"],
                    CUSTOMER_PORTAL_USER["password"], UserRole.CUSTOMER,
                )
                kwargs["user_id"] = portal_user.id
            cust = await _get_or_create_customer(session, c["name"], **kwargs)
            customer_records.append(cust)

        # ── Pricing rule ──────────────────────────────────────
        result = await session.execute(select(PricingRule).where(PricingRule.rule_name == "Standard"))
        if not result.scalar_one_or_none():
            session.add(PricingRule(
                id=uuid.uuid4(), rule_name="Standard",
                base_rate=5.00, per_mile_rate=1.50,
                rush_surcharge=3.00, heavy_surcharge=5.00,
                zone_config={"zones": {"central": 1.0, "zone_2": 1.2, "zone_3": 1.5}},
                active=True,
            ))

        # ── Jobs ──────────────────────────────────────────────
        existing_jobs = await session.execute(select(Job).limit(1))
        if existing_jobs.scalar_one_or_none():
            print("Jobs already exist — skipping job creation.\n")
        else:
            STATUS_DISTRIBUTION = (
                [JobStatus.PENDING] * 4
                + [JobStatus.ASSIGNED] * 4
                + [JobStatus.PICKED_UP] * 3
                + [JobStatus.IN_TRANSIT] * 4
                + [JobStatus.DELIVERED] * 8
                + [JobStatus.FAILED] * 2
            )
            random.shuffle(STATUS_DISTRIBUTION)

            for idx, target_status in enumerate(STATUS_DISTRIBUTION):
                customer = random.choice(customer_records)
                driver = random.choice(driver_records)
                price = _random_price()
                created = _past_datetime()

                needs_driver = target_status != JobStatus.PENDING
                is_terminal = target_status in (JobStatus.DELIVERED, JobStatus.FAILED)
                is_paid = target_status == JobStatus.DELIVERED and random.random() > 0.3

                job = Job(
                    id=uuid.uuid4(),
                    tracking_id=_tracking_id(),
                    customer_id=customer.id,
                    driver_id=driver.id if needs_driver else None,
                    pickup_address=random.choice(PICKUP_ADDRESSES),
                    dropoff_address=random.choice(DROPOFF_ADDRESSES),
                    status=target_status,
                    price=price,
                    payment_status=PaymentStatus.PAID if is_paid else PaymentStatus.UNPAID,
                    notes=random.choice(JOB_NOTES),
                    route_sequence=idx + 1 if target_status in (JobStatus.ASSIGNED, JobStatus.PICKED_UP) else None,
                )
                job.created_at = created
                job.updated_at = created + timedelta(hours=random.randint(0, 4))
                session.add(job)
                await session.flush()

                if target_status == JobStatus.DELIVERED:
                    pod = ProofOfDelivery(
                        id=uuid.uuid4(),
                        job_id=job.id,
                        recipient_name=random.choice(RECIPIENT_NAMES),
                        signature_url=f"https://storage.example.com/signatures/{job.tracking_id}.png",
                        photo_urls=[
                            f"https://storage.example.com/photos/{job.tracking_id}_1.jpg",
                            f"https://storage.example.com/photos/{job.tracking_id}_2.jpg",
                        ],
                        delivered_at=job.updated_at + timedelta(minutes=random.randint(5, 60)),
                        gps_lat=51.50 + random.uniform(-0.05, 0.05),
                        gps_lng=-0.12 + random.uniform(-0.05, 0.05),
                    )
                    session.add(pod)

            print(f"  Created {len(STATUS_DISTRIBUTION)} jobs\n")

        await session.commit()

        # ── Summary ───────────────────────────────────────────
        print("=" * 60)
        print("  SEED DATA — LOGIN CREDENTIALS")
        print("=" * 60)
        print(f"  {'Role':<12} {'Email':<40} {'Password'}")
        print(f"  {'-'*12} {'-'*40} {'-'*12}")
        print(f"  {'Admin':<12} {ADMIN['email']:<40} {ADMIN['password']}")
        print(f"  {'Dispatcher':<12} {DISPATCHER['email']:<40} {DISPATCHER['password']}")
        for d in DRIVERS:
            print(f"  {'Driver':<12} {d['email']:<40} {d['password']}")
        print(f"  {'Customer':<12} {CUSTOMER_PORTAL_USER['email']:<40} {CUSTOMER_PORTAL_USER['password']}")
        print("=" * 60)
        print()
        print("  Admin/Dispatcher login:  POST /api/auth/login")
        print("  Customer portal login:   POST /api/customer/auth/login")
        print("  Swagger UI:              http://localhost:8000/docs")
        print()


if __name__ == "__main__":
    asyncio.run(seed())
