from collections import defaultdict

from fastapi import APIRouter, status

from app.core.deps import CurrentUserDep, SessionDep
from app.core.exceptions import AppException
from app.crud.menu import (
    get_menu_by_id,
    get_menu_by_target,
    get_menu_category_by_id,
    list_menus,
    list_visible_menus,
)
from app.models.menu import Menu
from app.schemas.menu import (
    MenuCreateRequest,
    MenuListResponse,
    MenuOut,
    MenuReorderRequest,
    MenuUpdateRequest,
    NavigationMenuGroup,
    NavigationMenuItem,
    NavigationMenuResponse,
)
from app.services.menu_permissions import (
    can_read,
    can_write,
    resolve_read_roles,
    resolve_write_roles,
    serialize_role_permissions,
)
from app.services.access_control import ensure_read_permission, ensure_write_permission

router = APIRouter(prefix='/menus', tags=['menus'])



def _to_menu_out(menu: Menu) -> MenuOut:
    return MenuOut(
        id=menu.id,
        label=menu.label,
        icon=menu.icon,
        type=menu.type,
        target=menu.target,
        order=menu.order,
        is_visible=menu.is_visible,
        category_id=menu.category_id,
        category_label=menu.category.label if menu.category else None,
        is_admin_only=menu.is_admin_only,
        read_roles=resolve_read_roles(menu),
        write_roles=resolve_write_roles(menu),
    )


@router.get('', response_model=MenuListResponse)
async def get_menus(user: CurrentUserDep, session: SessionDep) -> MenuListResponse:
    await ensure_read_permission(session, target='/admin/menus', role=user.role)
    menus = await list_menus(session)
    return MenuListResponse(items=[_to_menu_out(menu) for menu in menus])


@router.get('/navigation', response_model=NavigationMenuResponse)
async def get_navigation_menus(user: CurrentUserDep, session: SessionDep) -> NavigationMenuResponse:
    menus = await list_visible_menus(session)

    grouped: dict[tuple[int | None, str, int], list[NavigationMenuItem]] = defaultdict(list)

    for menu in menus:
        if not can_read(menu, user.role):
            continue

        category = menu.category
        if category and not category.is_visible:
            category = None

        key = (
            category.id if category else None,
            category.label if category else '미분류',
            category.order if category else -1,
        )
        grouped[key].append(
            NavigationMenuItem(
                id=menu.id,
                label=menu.label,
                icon=menu.icon,
                type=menu.type,
                target=menu.target,
                order=menu.order,
                category_id=menu.category_id,
                can_write=can_write(menu, user.role),
            )
        )

    groups = [
        NavigationMenuGroup(
            category_id=category_id,
            category_label=category_label,
            order=category_order,
            items=sorted(items, key=lambda item: (item.order, item.id)),
        )
        for (category_id, category_label, category_order), items in grouped.items()
    ]

    groups.sort(key=lambda group: (group.order, group.category_label))
    return NavigationMenuResponse(groups=groups)


@router.post('', response_model=MenuOut, status_code=status.HTTP_201_CREATED)
async def create_menu(payload: MenuCreateRequest, user: CurrentUserDep, session: SessionDep) -> MenuOut:
    await ensure_write_permission(session, target='/admin/menus', role=user.role)
    if payload.category_id is not None:
        category = await get_menu_category_by_id(session, payload.category_id)
        if category is None:
            raise AppException('Menu category not found', 'MENU_CATEGORY_NOT_FOUND', 404)
    existing_target = await get_menu_by_target(session, payload.target)
    if existing_target is not None:
        raise AppException('Menu target already exists', 'MENU_TARGET_EXISTS', 409)

    read_roles, write_roles, is_admin_only = serialize_role_permissions(
        payload.read_roles,
        payload.write_roles,
        is_admin_only=payload.is_admin_only,
    )
    menu = Menu(
        label=payload.label,
        icon=payload.icon,
        type=payload.type,
        target=payload.target,
        order=payload.order,
        is_visible=payload.is_visible,
        category_id=payload.category_id,
        is_admin_only=is_admin_only,
        read_roles=read_roles,
        write_roles=write_roles,
    )
    session.add(menu)
    await session.commit()
    await session.refresh(menu)

    menu = await get_menu_by_id(session, menu.id)
    if menu is None:
        raise AppException('Menu not found', 'MENU_NOT_FOUND', 404)
    return _to_menu_out(menu)


@router.patch('/reorder', status_code=status.HTTP_204_NO_CONTENT)
async def reorder_menu(payload: MenuReorderRequest, user: CurrentUserDep, session: SessionDep) -> None:
    await ensure_write_permission(session, target='/admin/menus', role=user.role)
    menu_map = {menu.id: menu for menu in await list_menus(session)}

    for item in payload.items:
        menu = menu_map.get(item.id)
        if menu is None:
            raise AppException(f'Menu not found: {item.id}', 'MENU_NOT_FOUND', 404)
        menu.order = item.order

    await session.commit()


@router.patch('/{menu_id}', response_model=MenuOut)
async def update_menu(
    menu_id: int,
    payload: MenuUpdateRequest,
    user: CurrentUserDep,
    session: SessionDep,
) -> MenuOut:
    await ensure_write_permission(session, target='/admin/menus', role=user.role)
    menu = await get_menu_by_id(session, menu_id)
    if menu is None:
        raise AppException('Menu not found', 'MENU_NOT_FOUND', 404)

    updates = payload.model_dump(exclude_unset=True)

    if 'category_id' in updates and updates['category_id'] is not None:
        category = await get_menu_category_by_id(session, updates['category_id'])
        if category is None:
            raise AppException('Menu category not found', 'MENU_CATEGORY_NOT_FOUND', 404)

    next_target = updates.get('target')
    if isinstance(next_target, str):
        existing_target = await get_menu_by_target(session, next_target)
        if existing_target is not None and existing_target.id != menu.id:
            raise AppException('Menu target already exists', 'MENU_TARGET_EXISTS', 409)

    read_roles = updates.pop('read_roles', None)
    write_roles = updates.pop('write_roles', None)
    has_role_updates = read_roles is not None or write_roles is not None

    for key, value in updates.items():
        setattr(menu, key, value)

    if has_role_updates or 'is_admin_only' in updates:
        serialized_read, serialized_write, is_admin_only = serialize_role_permissions(
            read_roles if has_role_updates else None,
            write_roles if has_role_updates else None,
            is_admin_only=menu.is_admin_only,
        )
        menu.read_roles = serialized_read
        menu.write_roles = serialized_write
        menu.is_admin_only = is_admin_only

    await session.commit()

    menu = await get_menu_by_id(session, menu.id)
    if menu is None:
        raise AppException('Menu not found', 'MENU_NOT_FOUND', 404)
    return _to_menu_out(menu)


@router.delete('/{menu_id}', status_code=status.HTTP_204_NO_CONTENT)
async def delete_menu(menu_id: int, user: CurrentUserDep, session: SessionDep) -> None:
    await ensure_write_permission(session, target='/admin/menus', role=user.role)
    menu = await get_menu_by_id(session, menu_id)
    if menu is None:
        raise AppException('Menu not found', 'MENU_NOT_FOUND', 404)

    await session.delete(menu)
    await session.commit()
