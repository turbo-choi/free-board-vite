from __future__ import annotations

from fastapi import Request
from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.core.request_meta import get_client_ip
from app.core.security import TokenDecodeError, decode_access_token
from app.models.audit_log import AuditLog
from app.models.user import User

MAX_QUERY_STRING = 2000


def should_audit(path: str) -> bool:
    return path.startswith('/api/')


def _parse_bearer_token(header_value: str | None) -> str | None:
    if not header_value:
        return None
    scheme, _, token = header_value.partition(' ')
    if scheme.lower() != 'bearer':
        return None
    token = token.strip()
    return token or None


async def write_audit_log(
    request: Request,
    *,
    status_code: int,
    latency_ms: int,
) -> None:
    query_string = request.url.query.strip() or None
    if query_string and len(query_string) > MAX_QUERY_STRING:
        query_string = query_string[:MAX_QUERY_STRING]

    method = request.method.upper().strip()[:10]
    path = request.url.path.strip()[:255]
    user_agent = (request.headers.get('user-agent') or '').strip()[:300] or None
    ip_address = get_client_ip(request)

    user_id: int | None = None
    user_email: str | None = None
    user_role = None
    token = _parse_bearer_token(request.headers.get('authorization'))

    async with AsyncSessionLocal() as session:
        if token:
            try:
                payload = decode_access_token(token)
                subject = payload.get('sub')
                if subject and str(subject).isdigit():
                    actor = await session.scalar(select(User).where(User.id == int(subject)))
                    if actor is not None:
                        user_id = actor.id
                        user_email = actor.email
                        user_role = actor.role
            except TokenDecodeError:
                pass
            except Exception:
                pass

        session.add(
            AuditLog(
                user_id=user_id,
                user_email=user_email,
                user_role=user_role,
                method=method,
                path=path,
                query_string=query_string,
                status_code=status_code,
                is_success=status_code < 400,
                latency_ms=max(0, int(latency_ms)),
                ip_address=ip_address,
                user_agent=user_agent,
            )
        )
        await session.commit()
