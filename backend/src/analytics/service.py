from datetime import date, datetime, time, timedelta, timezone

from sqlalchemy import func, select, literal_column
from sqlalchemy.ext.asyncio import AsyncSession

from src.drivers.models import Driver
from src.jobs.models import Job, JobStatus
from src.pod.models import ProofOfDelivery

from src.analytics.schemas import (
    AnalyticsSummary,
    ByDayResponse,
    ByDriverResponse,
    DayBucket,
    DriverPerformance,
)

TERMINAL_DELIVERED = JobStatus.DELIVERED
TERMINAL_FAILED = JobStatus.FAILED
ACTIVE_STATUSES_VALUES = [
    JobStatus.PENDING.value,
    JobStatus.ASSIGNED.value,
    JobStatus.PICKED_UP.value,
    JobStatus.IN_TRANSIT.value,
]


def _range_start(days: int) -> datetime:
    return datetime.combine(
        date.today() - timedelta(days=days - 1), time.min, tzinfo=timezone.utc,
    )


async def get_summary(db: AsyncSession, days: int) -> AnalyticsSummary:
    since = _range_start(days)

    q = select(
        func.count().label("total"),
        func.sum(func.iif(Job.status == TERMINAL_DELIVERED, 1, 0)).label("delivered"),
        func.sum(func.iif(Job.status == TERMINAL_FAILED, 1, 0)).label("failed"),
        func.sum(func.iif(Job.status.in_(ACTIVE_STATUSES_VALUES), 1, 0)).label("active"),
    ).where(Job.created_at >= since)

    result = await db.execute(q)
    row = result.one()

    jobs_total = row.total or 0
    jobs_delivered = int(row.delivered or 0)
    jobs_failed = int(row.failed or 0)
    jobs_active = int(row.active or 0)

    completed = jobs_delivered + jobs_failed
    on_time_rate = (jobs_delivered / completed * 100) if completed > 0 else 100.0

    avg_q = await db.execute(
        select(
            func.avg(
                func.julianday(ProofOfDelivery.delivered_at)
                - func.julianday(Job.created_at)
            )
        )
        .select_from(Job)
        .join(ProofOfDelivery, ProofOfDelivery.job_id == Job.id)
        .where(Job.created_at >= since, Job.status == TERMINAL_DELIVERED)
    )
    avg_days = avg_q.scalar()
    avg_minutes = round(avg_days * 24 * 60, 1) if avg_days is not None else None

    return AnalyticsSummary(
        jobs_total=jobs_total,
        jobs_delivered=jobs_delivered,
        jobs_failed=jobs_failed,
        jobs_active=jobs_active,
        on_time_rate=round(on_time_rate, 1),
        avg_delivery_time_minutes=avg_minutes,
    )


async def get_by_day(db: AsyncSession, days: int) -> ByDayResponse:
    since = _range_start(days)

    day_expr = func.date(Job.created_at).label("day")
    q = (
        select(
            day_expr,
            func.count().label("total"),
            func.sum(func.iif(Job.status == TERMINAL_DELIVERED, 1, 0)).label("delivered"),
            func.sum(func.iif(Job.status == TERMINAL_FAILED, 1, 0)).label("failed"),
        )
        .where(Job.created_at >= since)
        .group_by(day_expr)
        .order_by(day_expr)
    )
    result = await db.execute(q)
    rows = result.all()

    row_map: dict[str, tuple] = {}
    for r in rows:
        day_key = str(r.day) if r.day is not None else ""
        row_map[day_key] = r

    buckets: list[DayBucket] = []
    for i in range(days):
        d = date.today() - timedelta(days=days - 1 - i)
        key = d.isoformat()
        if key in row_map:
            r = row_map[key]
            buckets.append(DayBucket(
                date=d,
                jobs_total=r.total or 0,
                jobs_delivered=int(r.delivered or 0),
                jobs_failed=int(r.failed or 0),
            ))
        else:
            buckets.append(DayBucket(date=d, jobs_total=0, jobs_delivered=0, jobs_failed=0))

    return ByDayResponse(range_days=days, buckets=buckets)


async def get_by_driver(db: AsyncSession, days: int) -> ByDriverResponse:
    since = _range_start(days)

    q = (
        select(
            Driver.id.label("driver_id"),
            Driver.name.label("driver_name"),
            func.sum(func.iif(Job.status == TERMINAL_DELIVERED, 1, 0)).label("completed"),
            func.sum(func.iif(Job.status == TERMINAL_FAILED, 1, 0)).label("failed"),
        )
        .join(Job, Job.driver_id == Driver.id)
        .where(Job.created_at >= since)
        .group_by(Driver.id, Driver.name)
        .order_by(func.sum(func.iif(Job.status == TERMINAL_DELIVERED, 1, 0)).desc())
    )
    result = await db.execute(q)

    drivers = []
    for row in result.all():
        comp = int(row.completed or 0)
        fail = int(row.failed or 0)
        total = comp + fail
        rate = (comp / total * 100) if total > 0 else 100.0
        drivers.append(
            DriverPerformance(
                driver_id=row.driver_id,
                driver_name=row.driver_name,
                jobs_completed=comp,
                jobs_failed=fail,
                on_time_rate=round(rate, 1),
            )
        )

    return ByDriverResponse(range_days=days, drivers=drivers)
