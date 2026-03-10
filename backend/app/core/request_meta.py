from fastapi import Request

from app.core.config import settings


def _sanitize_ip(raw: str | None) -> str | None:
    if not raw:
        return None
    value = raw.strip()
    if not value:
        return None
    return value[:64]


def _get_forwarded_ip(request: Request) -> str | None:
    forwarded_for = request.headers.get('x-forwarded-for')
    if not forwarded_for:
        return None
    first_hop = forwarded_for.split(',')[0]
    return _sanitize_ip(first_hop)


def get_client_ip(request: Request) -> str | None:
    if settings.trust_proxy_headers:
        forwarded_ip = _get_forwarded_ip(request)
        if forwarded_ip:
            return forwarded_ip

    client = request.client
    if client and client.host:
        return _sanitize_ip(client.host)
    return None
