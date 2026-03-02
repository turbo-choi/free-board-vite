from __future__ import annotations

from collections.abc import Iterable

from app.models.menu import Menu
from app.models.user import UserRole

ROLE_PRIORITY: tuple[UserRole, ...] = (UserRole.USER, UserRole.STAFF, UserRole.ADMIN)
DEFAULT_READ_ROLES: tuple[UserRole, ...] = ROLE_PRIORITY
DEFAULT_WRITE_ROLES: tuple[UserRole, ...] = (UserRole.STAFF, UserRole.ADMIN)


def _normalize_roles(roles: Iterable[UserRole], *, fallback: Iterable[UserRole]) -> list[UserRole]:
    source = list(roles) or list(fallback)
    unique = []
    for role in ROLE_PRIORITY:
        if role in source and role not in unique:
            unique.append(role)
    if unique:
        return unique
    return list(DEFAULT_READ_ROLES)


def parse_roles_csv(raw: str | None, *, fallback: Iterable[UserRole]) -> list[UserRole]:
    if not raw:
        return _normalize_roles([], fallback=fallback)

    parsed: list[UserRole] = []
    for token in raw.split(','):
        normalized = token.strip().upper()
        if not normalized:
            continue
        try:
            parsed.append(UserRole(normalized))
        except ValueError:
            continue

    return _normalize_roles(parsed, fallback=fallback)


def roles_to_csv(roles: Iterable[UserRole], *, fallback: Iterable[UserRole]) -> str:
    normalized = _normalize_roles(roles, fallback=fallback)
    return ','.join(role.value for role in normalized)


def resolve_read_roles(menu: Menu) -> list[UserRole]:
    fallback = [UserRole.ADMIN] if menu.is_admin_only else list(DEFAULT_READ_ROLES)
    return parse_roles_csv(menu.read_roles, fallback=fallback)


def resolve_write_roles(menu: Menu) -> list[UserRole]:
    read_roles = resolve_read_roles(menu)
    fallback = [UserRole.ADMIN] if menu.is_admin_only else [role for role in DEFAULT_WRITE_ROLES if role in read_roles]
    if not fallback:
        fallback = [read_roles[-1]]
    parsed = parse_roles_csv(menu.write_roles, fallback=fallback)
    write_roles = [role for role in parsed if role in read_roles]
    if write_roles:
        return write_roles
    return fallback


def can_read(menu: Menu, role: UserRole) -> bool:
    return role in resolve_read_roles(menu)


def can_write(menu: Menu, role: UserRole) -> bool:
    return role in resolve_write_roles(menu)


def serialize_role_permissions(
    read_roles: list[UserRole] | None,
    write_roles: list[UserRole] | None,
    *,
    is_admin_only: bool,
) -> tuple[str, str, bool]:
    default_read = [UserRole.ADMIN] if is_admin_only else list(DEFAULT_READ_ROLES)
    normalized_read = _normalize_roles(read_roles or [], fallback=default_read)

    default_write = [UserRole.ADMIN] if is_admin_only else [role for role in DEFAULT_WRITE_ROLES if role in normalized_read]
    if not default_write:
        default_write = [normalized_read[-1]]

    normalized_write = _normalize_roles(write_roles or [], fallback=default_write)
    normalized_write = [role for role in normalized_write if role in normalized_read]
    if not normalized_write:
        normalized_write = default_write

    admin_only = normalized_read == [UserRole.ADMIN]
    return (
        ','.join(role.value for role in normalized_read),
        ','.join(role.value for role in normalized_write),
        admin_only,
    )
