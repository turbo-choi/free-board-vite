from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.menu import Menu
from app.models.menu_category import MenuCategory


async def list_menus(session: AsyncSession) -> list[Menu]:
    result = await session.scalars(
        select(Menu)
        .options(joinedload(Menu.category))
        .order_by(Menu.order.asc(), Menu.id.asc())
    )
    return list(result)


async def list_visible_menus(session: AsyncSession) -> list[Menu]:
    stmt = select(Menu).options(joinedload(Menu.category)).where(Menu.is_visible.is_(True))
    result = await session.scalars(stmt.order_by(Menu.order.asc(), Menu.id.asc()))
    return list(result)


async def get_menu_by_id(session: AsyncSession, menu_id: int) -> Menu | None:
    return await session.scalar(
        select(Menu).where(Menu.id == menu_id).options(joinedload(Menu.category))
    )


async def get_menu_by_target(session: AsyncSession, target: str) -> Menu | None:
    return await session.scalar(
        select(Menu).where(Menu.target == target).options(joinedload(Menu.category))
    )


async def list_menu_categories(session: AsyncSession) -> list[MenuCategory]:
    result = await session.scalars(select(MenuCategory).order_by(MenuCategory.order.asc(), MenuCategory.id.asc()))
    return list(result)


async def get_menu_category_by_id(session: AsyncSession, category_id: int) -> MenuCategory | None:
    return await session.scalar(select(MenuCategory).where(MenuCategory.id == category_id))


async def get_menu_category_by_label(session: AsyncSession, label: str) -> MenuCategory | None:
    return await session.scalar(select(MenuCategory).where(MenuCategory.label == label))
