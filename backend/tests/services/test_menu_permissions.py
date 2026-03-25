from app.models.menu import Menu
from app.models.user import UserRole
from app.services.menu_permissions import (
    can_read,
    can_write,
    parse_roles_csv,
    resolve_write_roles,
    serialize_role_permissions,
)


def make_menu(**overrides) -> Menu:
    defaults = {
        'label': '테스트 메뉴',
        'type': 'link',
        'target': '/admin/menus',
        'order': 1,
        'is_visible': True,
        'category_id': None,
        'is_admin_only': False,
        'read_roles': 'USER,STAFF,ADMIN',
        'write_roles': 'STAFF,ADMIN',
    }
    defaults.update(overrides)
    return Menu(**defaults)


def test_parse_roles_csv_ignores_unknown_roles_and_keeps_priority_order():
    parsed = parse_roles_csv('ADMIN,UNKNOWN,USER,ADMIN', fallback=[UserRole.USER])

    assert parsed == [UserRole.USER, UserRole.ADMIN]


def test_resolve_write_roles_falls_back_to_last_read_role_when_needed():
    menu = make_menu(read_roles='USER', write_roles='')

    assert resolve_write_roles(menu) == [UserRole.USER]
    assert can_read(menu, UserRole.USER) is True
    assert can_write(menu, UserRole.STAFF) is False


def test_serialize_role_permissions_enforces_admin_only_output():
    read_csv, write_csv, is_admin_only = serialize_role_permissions(
        [UserRole.ADMIN],
        [UserRole.USER, UserRole.ADMIN],
        is_admin_only=True,
    )

    assert (read_csv, write_csv, is_admin_only) == ('ADMIN', 'ADMIN', True)
