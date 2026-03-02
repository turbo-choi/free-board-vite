from datetime import datetime

from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog


async def list_audit_logs(
    session: AsyncSession,
    *,
    q: str | None,
    method: str | None,
    status_code: int | None,
    is_success: bool | None,
    from_at: datetime | None,
    to_at: datetime | None,
    page: int,
    size: int,
) -> tuple[list[AuditLog], int]:
    stmt = select(AuditLog)
    count_stmt = select(func.count(AuditLog.id))

    filters = []
    if q and q.strip():
        keyword = f'%{q.strip()}%'
        filters.append(
            or_(
                AuditLog.path.ilike(keyword),
                AuditLog.user_email.ilike(keyword),
                AuditLog.method.ilike(keyword),
                AuditLog.ip_address.ilike(keyword),
            )
        )

    if method:
        filters.append(AuditLog.method == method.upper())

    if status_code is not None:
        filters.append(AuditLog.status_code == status_code)

    if is_success is not None:
        filters.append(AuditLog.is_success.is_(is_success))

    if from_at is not None:
        filters.append(AuditLog.created_at >= from_at)

    if to_at is not None:
        filters.append(AuditLog.created_at <= to_at)

    if filters:
        criteria = and_(*filters)
        stmt = stmt.where(criteria)
        count_stmt = count_stmt.where(criteria)

    total = int(await session.scalar(count_stmt) or 0)
    rows = await session.scalars(
        stmt.order_by(AuditLog.created_at.desc(), AuditLog.id.desc())
        .offset((page - 1) * size)
        .limit(size)
    )
    return list(rows), total
