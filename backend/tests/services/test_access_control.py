import pytest

from app.core.exceptions import AppException
from app.models.board import Board
from app.models.user import UserRole
from app.services import access_control


@pytest.mark.asyncio
async def test_has_read_permission_defaults_missing_menu_to_admin(monkeypatch):
    async def fake_get_menu_by_target(session, target):
        return None

    monkeypatch.setattr(access_control, 'get_menu_by_target', fake_get_menu_by_target)

    assert await access_control.has_read_permission(None, target='/missing', role=UserRole.ADMIN) is True
    assert await access_control.has_read_permission(None, target='/missing', role=UserRole.USER) is False


@pytest.mark.asyncio
async def test_ensure_write_permission_raises_for_forbidden_role(monkeypatch):
    async def fake_has_write_permission(session, *, target, role):
        return False

    monkeypatch.setattr(access_control, 'has_write_permission', fake_has_write_permission)

    with pytest.raises(AppException) as exc_info:
        await access_control.ensure_write_permission(None, target='/admin/menus', role=UserRole.USER)

    assert exc_info.value.status_code == 403
    assert exc_info.value.code == 'FORBIDDEN'


@pytest.mark.asyncio
async def test_list_readable_boards_filters_against_menu_permissions(monkeypatch):
    boards = [
        Board(id=1, name='공지', slug='notice', description=None, settings_json={}),
        Board(id=2, name='자유', slug='free', description=None, settings_json={}),
    ]

    class MenuStub:
        def __init__(self, target):
            self.target = target

    async def fake_list_boards(session):
        return boards

    async def fake_list_menus(session):
        return [MenuStub('/boards/notice')]

    def fake_can_read(menu, role):
        return menu.target == '/boards/notice' and role == UserRole.STAFF

    monkeypatch.setattr(access_control, 'list_boards', fake_list_boards)
    monkeypatch.setattr(access_control, 'list_menus', fake_list_menus)
    monkeypatch.setattr(access_control, 'can_read', fake_can_read)

    readable = await access_control.list_readable_boards(None, role=UserRole.STAFF)

    assert [board.slug for board in readable] == ['notice']
