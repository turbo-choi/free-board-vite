from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppException
from app.crud.menu import get_menu_by_target
from app.models.user import UserRole
from app.services.menu_permissions import can_read, can_write


async def has_read_permission(session: AsyncSession, *, target: str, role: UserRole) -> bool:
    menu = await get_menu_by_target(session, target)
    if menu is None:
        return role == UserRole.ADMIN
    return can_read(menu, role)


async def has_write_permission(session: AsyncSession, *, target: str, role: UserRole) -> bool:
    menu = await get_menu_by_target(session, target)
    if menu is None:
        return role == UserRole.ADMIN
    return can_write(menu, role)


async def ensure_read_permission(session: AsyncSession, *, target: str, role: UserRole) -> None:
    if await has_read_permission(session, target=target, role=role):
        return
    raise AppException('No permission to read this screen', 'FORBIDDEN', 403)


async def ensure_write_permission(session: AsyncSession, *, target: str, role: UserRole) -> None:
    if await has_write_permission(session, target=target, role=role):
        return
    raise AppException('No permission to write this screen', 'FORBIDDEN', 403)
