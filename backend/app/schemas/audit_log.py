from datetime import datetime

from pydantic import BaseModel

from app.models.user import UserRole


class AuditLogOut(BaseModel):
    id: int
    user_id: int | None
    user_email: str | None
    user_role: UserRole | None
    method: str
    path: str
    query_string: str | None
    status_code: int
    is_success: bool
    latency_ms: int
    ip_address: str | None
    user_agent: str | None
    created_at: datetime

    model_config = {'from_attributes': True}


class AuditLogListResponse(BaseModel):
    items: list[AuditLogOut]
    total: int
    page: int
    size: int
