from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Query

from app.core.deps import CurrentUserDep, SessionDep
from app.core.exceptions import AppException
from app.crud.audit_log import list_audit_logs
from app.schemas.audit_log import AuditLogListResponse, AuditLogOut
from app.services.access_control import ensure_read_permission

router = APIRouter(prefix='/audit-logs', tags=['audit-logs'])


@router.get('', response_model=AuditLogListResponse)
async def get_audit_logs(
    user: CurrentUserDep,
    session: SessionDep,
    q: str | None = Query(default=None),
    method: Annotated[str | None, Query(pattern=r'^[A-Za-z]+$')] = None,
    status_code: Annotated[int | None, Query(ge=100, le=599)] = None,
    is_success: bool | None = Query(default=None),
    from_at: datetime | None = Query(default=None),
    to_at: datetime | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=200),
) -> AuditLogListResponse:
    await ensure_read_permission(session, target='/admin/audit-logs', role=user.role)

    if from_at and to_at and from_at > to_at:
        raise AppException('from_at must be less than or equal to to_at', 'INVALID_DATE_RANGE', 422)

    logs, total = await list_audit_logs(
        session,
        q=q,
        method=method.upper() if method else None,
        status_code=status_code,
        is_success=is_success,
        from_at=from_at,
        to_at=to_at,
        page=page,
        size=size,
    )

    return AuditLogListResponse(
        items=[AuditLogOut.model_validate(log) for log in logs],
        total=total,
        page=page,
        size=size,
    )
