from fastapi import APIRouter, status
from sqlalchemy import select

from app.core.deps import CurrentUserDep, SessionDep
from app.core.exceptions import AppException
from app.crud.menu import (
    get_menu_category_by_id,
    get_menu_category_by_label,
    list_menu_categories,
)
from app.models.menu import Menu
from app.models.menu_category import MenuCategory
from app.schemas.menu import (
    MenuCategoryCreateRequest,
    MenuCategoryListResponse,
    MenuCategoryOut,
    MenuCategoryReorderRequest,
)
from app.services.access_control import ensure_read_permission, ensure_write_permission

router = APIRouter(prefix='/menu-categories', tags=['menu-categories'])


@router.get('', response_model=MenuCategoryListResponse)
async def get_categories(user: CurrentUserDep, session: SessionDep) -> MenuCategoryListResponse:
    await ensure_read_permission(session, target='/admin/menus', role=user.role)
    categories = await list_menu_categories(session)
    return MenuCategoryListResponse(items=[MenuCategoryOut.model_validate(category) for category in categories])


@router.post('', response_model=MenuCategoryOut, status_code=status.HTTP_201_CREATED)
async def create_category(
    payload: MenuCategoryCreateRequest,
    user: CurrentUserDep,
    session: SessionDep,
) -> MenuCategoryOut:
    await ensure_write_permission(session, target='/admin/menus', role=user.role)
    existing = await get_menu_category_by_label(session, payload.label.strip())
    if existing is not None:
        raise AppException('Category label already exists', 'MENU_CATEGORY_EXISTS', 409)

    category = MenuCategory(
        label=payload.label.strip(),
        order=payload.order,
        is_visible=payload.is_visible,
    )
    session.add(category)
    await session.commit()
    await session.refresh(category)
    return MenuCategoryOut.model_validate(category)


@router.patch('/reorder', status_code=status.HTTP_204_NO_CONTENT)
async def reorder_categories(
    payload: MenuCategoryReorderRequest,
    user: CurrentUserDep,
    session: SessionDep,
) -> None:
    await ensure_write_permission(session, target='/admin/menus', role=user.role)
    category_map = {category.id: category for category in await list_menu_categories(session)}

    for item in payload.items:
        category = category_map.get(item.id)
        if category is None:
            raise AppException(f'Menu category not found: {item.id}', 'MENU_CATEGORY_NOT_FOUND', 404)
        category.order = item.order

    await session.commit()


@router.delete('/{category_id}', status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(category_id: int, user: CurrentUserDep, session: SessionDep) -> None:
    await ensure_write_permission(session, target='/admin/menus', role=user.role)
    category = await get_menu_category_by_id(session, category_id)
    if category is None:
        raise AppException('Menu category not found', 'MENU_CATEGORY_NOT_FOUND', 404)

    menus = list(await session.scalars(select(Menu).where(Menu.category_id == category_id)))
    for menu in menus:
        menu.category_id = None

    await session.delete(category)
    await session.commit()
