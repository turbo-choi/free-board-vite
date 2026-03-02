from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import hash_password
from app.models.attachment import Attachment
from app.models.board import Board
from app.models.comment import Comment
from app.models.menu import Menu
from app.models.menu_category import MenuCategory
from app.models.post import Post
from app.models.user import User, UserRole
from app.models.user_status_event import UserStatusEvent, UserStatusEventType

DEFAULT_ADMIN_EMAIL = 'admin@corp.com'
DEFAULT_ADMIN_NAME = 'Admin'
DEFAULT_ADMIN_PASSWORD = 'admin1234'

TEST_DATA_MARKER = '[SEED-STATS]'
TEST_USER_PASSWORD = 'test1234'
SEED_SNAPSHOT_PATH = Path(__file__).with_name('seed_snapshot.json')

DEFAULT_BOARDS = [
    {
        'name': '공지사항',
        'slug': 'notice',
        'description': '사내 공지사항 게시판',
        'settings_json': {'allowAnonymous': False, 'allowAttachment': True, 'allowPin': True},
    },
    {
        'name': '자유',
        'slug': 'free',
        'description': '자유 게시판',
        'settings_json': {'allowAnonymous': False, 'allowAttachment': True, 'allowPin': False},
    },
    {
        'name': '자료실',
        'slug': 'archive',
        'description': '자료 공유 게시판',
        'settings_json': {'allowAnonymous': False, 'allowAttachment': True, 'allowPin': False},
    },
    {
        'name': 'Q&A',
        'slug': 'qa',
        'description': '질문과 답변 게시판',
        'settings_json': {'allowAnonymous': False, 'allowAttachment': True, 'allowPin': False},
    },
]

DEFAULT_MENU_CATEGORIES = [
    {'label': '주요', 'order': 1, 'is_visible': True},
    {'label': '게시판', 'order': 2, 'is_visible': True},
    {'label': '통계', 'order': 3, 'is_visible': True},
    {'label': '관리자', 'order': 4, 'is_visible': True},
    {'label': '지원', 'order': 5, 'is_visible': True},
]

DEFAULT_MENUS = [
    {
        'label': 'Dashboard',
        'icon': 'layout-dashboard',
        'type': 'internal',
        'target': '/dashboard',
        'order': 1,
        'is_visible': True,
        'is_admin_only': False,
        'read_roles': 'USER,STAFF,ADMIN',
        'write_roles': 'STAFF,ADMIN',
        'category_label': '주요',
    },
    {
        'label': 'Notices',
        'icon': 'bell',
        'type': 'board',
        'target': '/boards/notice',
        'order': 1,
        'is_visible': True,
        'is_admin_only': False,
        'read_roles': 'USER,STAFF,ADMIN',
        'write_roles': 'STAFF,ADMIN',
        'category_label': '게시판',
    },
    {
        'label': 'Community',
        'icon': 'users',
        'type': 'board',
        'target': '/boards/free',
        'order': 2,
        'is_visible': True,
        'is_admin_only': False,
        'read_roles': 'USER,STAFF,ADMIN',
        'write_roles': 'STAFF,ADMIN',
        'category_label': '게시판',
    },
    {
        'label': 'Resources',
        'icon': 'folder-kanban',
        'type': 'board',
        'target': '/boards/archive',
        'order': 3,
        'is_visible': True,
        'is_admin_only': False,
        'read_roles': 'USER,STAFF,ADMIN',
        'write_roles': 'STAFF,ADMIN',
        'category_label': '게시판',
    },
    {
        'label': 'Q&A',
        'icon': 'help-circle',
        'type': 'board',
        'target': '/boards/qa',
        'order': 4,
        'is_visible': True,
        'is_admin_only': False,
        'read_roles': 'USER,STAFF,ADMIN',
        'write_roles': 'STAFF,ADMIN',
        'category_label': '게시판',
    },
    {
        'label': '통계모니터링',
        'icon': 'chart-column',
        'type': 'internal',
        'target': '/stats/monitoring',
        'order': 1,
        'is_visible': True,
        'is_admin_only': True,
        'read_roles': 'ADMIN',
        'write_roles': 'ADMIN',
        'category_label': '통계',
    },
    {
        'label': '관리자 - 게시판',
        'icon': 'layout-grid',
        'type': 'internal',
        'target': '/admin/boards',
        'order': 1,
        'is_visible': True,
        'is_admin_only': True,
        'read_roles': 'ADMIN',
        'write_roles': 'ADMIN',
        'category_label': '관리자',
    },
    {
        'label': '관리자 - 메뉴',
        'icon': 'menu-square',
        'type': 'internal',
        'target': '/admin/menus',
        'order': 2,
        'is_visible': True,
        'is_admin_only': True,
        'read_roles': 'ADMIN',
        'write_roles': 'ADMIN',
        'category_label': '관리자',
    },
    {
        'label': '관리자 - 회원',
        'icon': 'users-round',
        'type': 'internal',
        'target': '/admin/users',
        'order': 3,
        'is_visible': True,
        'is_admin_only': True,
        'read_roles': 'ADMIN',
        'write_roles': 'ADMIN',
        'category_label': '관리자',
    },
    {
        'label': '로그 모니터링',
        'icon': 'activity',
        'type': 'internal',
        'target': '/admin/audit-logs',
        'order': 4,
        'is_visible': True,
        'is_admin_only': True,
        'read_roles': 'ADMIN',
        'write_roles': 'ADMIN',
        'category_label': '관리자',
    },
    {
        'label': 'Support',
        'icon': 'life-buoy',
        'type': 'external',
        'target': 'mailto:support@corp.local',
        'order': 1,
        'is_visible': True,
        'is_admin_only': False,
        'read_roles': 'USER,STAFF,ADMIN',
        'write_roles': 'STAFF,ADMIN',
        'category_label': '지원',
    },
]

TEST_USER_SPECS = [
    {
        'name': 'Staff Kim',
        'email': 'staff.kim@corp.com',
        'role': UserRole.STAFF,
        'created_days_ago': 45,
        'is_active': True,
        'login_count': 36,
    },
    {
        'name': 'Staff Lee',
        'email': 'staff.lee@corp.com',
        'role': UserRole.STAFF,
        'created_days_ago': 38,
        'is_active': True,
        'login_count': 24,
    },
    {
        'name': 'User Park',
        'email': 'user.park@corp.com',
        'role': UserRole.USER,
        'created_days_ago': 30,
        'is_active': True,
        'login_count': 15,
    },
    {
        'name': 'User Choi',
        'email': 'user.choi@corp.com',
        'role': UserRole.USER,
        'created_days_ago': 26,
        'is_active': True,
        'login_count': 11,
    },
    {
        'name': 'User Jung',
        'email': 'user.jung@corp.com',
        'role': UserRole.USER,
        'created_days_ago': 22,
        'is_active': True,
        'login_count': 8,
    },
    {
        'name': 'User Han',
        'email': 'user.han@corp.com',
        'role': UserRole.USER,
        'created_days_ago': 20,
        'is_active': False,
        'deactivated_days_ago': 12,
        'login_count': 6,
    },
    {
        'name': 'User Seo',
        'email': 'user.seo@corp.com',
        'role': UserRole.USER,
        'created_days_ago': 16,
        'is_active': False,
        'deactivated_days_ago': 6,
        'login_count': 4,
    },
    {
        'name': 'User Min',
        'email': 'user.min@corp.com',
        'role': UserRole.USER,
        'created_days_ago': 12,
        'is_active': False,
        'deactivated_days_ago': 2,
        'login_count': 2,
    },
]


def _days_ago(base: datetime, *, days: int, hours: int = 0) -> datetime:
    return base - timedelta(days=days, hours=hours)


def _parse_datetime(raw: str | None) -> datetime | None:
    if not raw:
        return None

    normalized = raw.strip()
    if normalized.endswith('Z'):
        normalized = normalized[:-1] + '+00:00'

    try:
        return datetime.fromisoformat(normalized)
    except ValueError:
        return None


def _normalize_bool(raw: Any, default: bool = False) -> bool:
    if isinstance(raw, bool):
        return raw
    if isinstance(raw, str):
        normalized = raw.strip().lower()
        if normalized in {'1', 'true', 'yes', 'y'}:
            return True
        if normalized in {'0', 'false', 'no', 'n'}:
            return False
    if isinstance(raw, (int, float)):
        return bool(raw)
    return default


def _load_seed_snapshot() -> dict[str, Any] | None:
    if not SEED_SNAPSHOT_PATH.exists():
        return None

    try:
        loaded = json.loads(SEED_SNAPSHOT_PATH.read_text(encoding='utf-8'))
    except (json.JSONDecodeError, OSError):
        return None

    if isinstance(loaded, dict):
        return loaded
    return None


async def _seed_snapshot_data(session: AsyncSession) -> bool:
    snapshot = _load_seed_snapshot()
    if snapshot is None:
        return False

    user_map: dict[str, User] = {}
    board_map: dict[str, Board] = {}
    category_map: dict[str, MenuCategory] = {}
    post_id_map: dict[int, int] = {}

    users_data = snapshot.get('users', [])
    if isinstance(users_data, list):
        for row in users_data:
            if not isinstance(row, dict):
                continue
            email = str(row.get('email', '')).strip().lower()
            if not email:
                continue
            exists = await session.scalar(select(User).where(User.email == email))

            role_raw = str(row.get('role', UserRole.USER.value)).strip().upper()
            try:
                role = UserRole(role_raw)
            except ValueError:
                role = UserRole.USER

            created_at = _parse_datetime(str(row.get('created_at', '')).strip() or None)
            login_count_raw = row.get('login_count')
            login_count = int(login_count_raw) if isinstance(login_count_raw, int) else 0
            password_hash = str(row.get('password_hash', '')).strip() or None
            name = str(row.get('name', '')).strip() or email.split('@')[0]
            is_active = _normalize_bool(row.get('is_active'), default=True)

            if exists is None:
                user = User(
                    name=name,
                    email=email,
                    role=role,
                    is_active=is_active,
                    password_hash=password_hash,
                    login_count=login_count,
                )
                if created_at:
                    user.created_at = created_at
                session.add(user)
                await session.flush()
            else:
                user = exists
                user.name = name
                user.role = role
                user.is_active = is_active
                user.login_count = login_count
                if password_hash:
                    user.password_hash = password_hash
                if created_at:
                    user.created_at = created_at

            user_map[email] = user

    boards_data = snapshot.get('boards', [])
    if isinstance(boards_data, list):
        for row in boards_data:
            if not isinstance(row, dict):
                continue
            slug = str(row.get('slug', '')).strip()
            if not slug:
                continue
            exists = await session.scalar(select(Board).where(Board.slug == slug))
            name = str(row.get('name', '')).strip() or slug
            description_raw = row.get('description')
            description = str(description_raw).strip() if isinstance(description_raw, str) else None
            settings_json = row.get('settings_json') if isinstance(row.get('settings_json'), dict) else {}
            created_at = _parse_datetime(str(row.get('created_at', '')).strip() or None)

            if exists is None:
                board = Board(
                    name=name,
                    slug=slug,
                    description=description,
                    settings_json=settings_json,
                )
                if created_at:
                    board.created_at = created_at
                session.add(board)
                await session.flush()
            else:
                board = exists
                board.name = name
                board.description = description
                board.settings_json = settings_json
                if created_at:
                    board.created_at = created_at

            board_map[slug] = board

    categories_data = snapshot.get('menu_categories', [])
    if isinstance(categories_data, list):
        for row in categories_data:
            if not isinstance(row, dict):
                continue
            label = str(row.get('label', '')).strip()
            if not label:
                continue
            exists = await session.scalar(select(MenuCategory).where(MenuCategory.label == label))
            order_raw = row.get('order')
            order = int(order_raw) if isinstance(order_raw, int) else 0
            is_visible = _normalize_bool(row.get('is_visible'), default=True)

            if exists is None:
                category = MenuCategory(label=label, order=order, is_visible=is_visible)
                session.add(category)
                await session.flush()
            else:
                category = exists
                category.order = order
                category.is_visible = is_visible
            category_map[label] = category

    menus_data = snapshot.get('menus', [])
    if isinstance(menus_data, list):
        for row in menus_data:
            if not isinstance(row, dict):
                continue
            target = str(row.get('target', '')).strip()
            if not target:
                continue
            exists = await session.scalar(select(Menu).where(Menu.target == target))

            category_label = str(row.get('category_label', '')).strip()
            category = category_map.get(category_label)
            order_raw = row.get('order')

            payload = {
                'label': str(row.get('label', '')).strip() or target,
                'icon': str(row.get('icon', '')).strip() or None,
                'type': str(row.get('type', '')).strip() or 'internal',
                'target': target,
                'order': int(order_raw) if isinstance(order_raw, int) else 0,
                'is_visible': _normalize_bool(row.get('is_visible'), default=True),
                'category_id': category.id if category else None,
                'is_admin_only': _normalize_bool(row.get('is_admin_only'), default=False),
                'read_roles': str(row.get('read_roles', '')).strip() or 'USER,STAFF,ADMIN',
                'write_roles': str(row.get('write_roles', '')).strip() or 'STAFF,ADMIN',
            }

            if exists is None:
                session.add(Menu(**payload))
            else:
                for key, value in payload.items():
                    setattr(exists, key, value)

    status_events_data = snapshot.get('user_status_events', [])
    if isinstance(status_events_data, list):
        for row in status_events_data:
            if not isinstance(row, dict):
                continue
            email = str(row.get('user_email', '')).strip().lower()
            user = user_map.get(email)
            if user is None:
                continue

            event_type_raw = str(row.get('event_type', '')).strip().upper()
            try:
                event_type = UserStatusEventType(event_type_raw)
            except ValueError:
                continue

            created_at = _parse_datetime(str(row.get('created_at', '')).strip() or None)
            existing_stmt = select(UserStatusEvent.id).where(
                UserStatusEvent.user_id == user.id,
                UserStatusEvent.event_type == event_type,
            )
            if created_at:
                existing_stmt = existing_stmt.where(UserStatusEvent.created_at == created_at)

            exists = await session.scalar(existing_stmt.limit(1))
            if exists is not None:
                continue

            event = UserStatusEvent(user_id=user.id, event_type=event_type)
            if created_at:
                event.created_at = created_at
            session.add(event)

    posts_data = snapshot.get('posts', [])
    if isinstance(posts_data, list):
        for row in posts_data:
            if not isinstance(row, dict):
                continue

            source_id_raw = row.get('source_id')
            try:
                source_id = int(source_id_raw)
            except (TypeError, ValueError):
                source_id = 0

            existing_by_id: Post | None = None
            if source_id > 0:
                existing_by_id = await session.scalar(select(Post).where(Post.id == source_id))
                if existing_by_id is not None:
                    post_id_map[source_id] = existing_by_id.id

            board_slug = str(row.get('board_slug', '')).strip()
            author_email = str(row.get('author_email', '')).strip().lower()
            board = board_map.get(board_slug)
            author = user_map.get(author_email)
            if board is None or author is None:
                continue

            title = str(row.get('title', '')).strip()
            if not title:
                continue
            content = str(row.get('content', ''))
            created_at = _parse_datetime(str(row.get('created_at', '')).strip() or None)
            updated_at = _parse_datetime(str(row.get('updated_at', '')).strip() or None)

            if existing_by_id is not None:
                existing_by_id.board_id = board.id
                existing_by_id.author_id = author.id
                existing_by_id.title = title
                existing_by_id.content = content
                existing_by_id.is_pinned = _normalize_bool(
                    row.get('is_pinned'),
                    default=existing_by_id.is_pinned,
                )
                if isinstance(row.get('view_count'), int):
                    existing_by_id.view_count = int(row['view_count'])
                if created_at:
                    existing_by_id.created_at = created_at
                if updated_at:
                    existing_by_id.updated_at = updated_at
                continue

            exists_stmt = select(Post).where(
                Post.board_id == board.id,
                Post.author_id == author.id,
                Post.title == title,
            )
            if created_at:
                exists_stmt = exists_stmt.where(Post.created_at == created_at)
            post = await session.scalar(exists_stmt.limit(1))

            if post is None:
                post = Post(
                    id=source_id if source_id > 0 else None,
                    board_id=board.id,
                    title=title,
                    content=content,
                    author_id=author.id,
                    is_pinned=_normalize_bool(row.get('is_pinned'), default=False),
                    view_count=int(row.get('view_count', 0)) if isinstance(row.get('view_count'), int) else 0,
                )
                if created_at:
                    post.created_at = created_at
                if updated_at:
                    post.updated_at = updated_at
                session.add(post)
                await session.flush()
            else:
                post.content = content
                post.is_pinned = _normalize_bool(row.get('is_pinned'), default=post.is_pinned)
                if isinstance(row.get('view_count'), int):
                    post.view_count = int(row['view_count'])
                if created_at:
                    post.created_at = created_at
                if updated_at:
                    post.updated_at = updated_at

            if source_id > 0:
                post_id_map[source_id] = post.id

    comments_data = snapshot.get('comments', [])
    if isinstance(comments_data, list):
        for row in comments_data:
            if not isinstance(row, dict):
                continue

            post_source_id_raw = row.get('post_source_id')
            try:
                post_source_id = int(post_source_id_raw)
            except (TypeError, ValueError):
                continue
            post_id = post_id_map.get(post_source_id)
            if not post_id:
                continue

            source_id_raw = row.get('source_id')
            try:
                source_id = int(source_id_raw)
            except (TypeError, ValueError):
                source_id = 0

            if source_id > 0:
                existing_by_id = await session.scalar(select(Comment.id).where(Comment.id == source_id))
                if existing_by_id is not None:
                    continue

            author_email = str(row.get('author_email', '')).strip().lower()
            author = user_map.get(author_email)
            if author is None:
                continue

            content = str(row.get('content', ''))
            created_at = _parse_datetime(str(row.get('created_at', '')).strip() or None)
            updated_at = _parse_datetime(str(row.get('updated_at', '')).strip() or None)

            exists_stmt = select(Comment.id).where(
                Comment.post_id == post_id,
                Comment.author_id == author.id,
                Comment.content == content,
            )
            if created_at:
                exists_stmt = exists_stmt.where(Comment.created_at == created_at)
            exists = await session.scalar(exists_stmt.limit(1))
            if exists is not None:
                continue

            comment = Comment(
                id=source_id if source_id > 0 else None,
                post_id=post_id,
                author_id=author.id,
                content=content,
            )
            if created_at:
                comment.created_at = created_at
            if updated_at:
                comment.updated_at = updated_at
            session.add(comment)

    attachments_data = snapshot.get('attachments', [])
    if isinstance(attachments_data, list):
        for row in attachments_data:
            if not isinstance(row, dict):
                continue

            post_source_id_raw = row.get('post_source_id')
            try:
                post_source_id = int(post_source_id_raw)
            except (TypeError, ValueError):
                continue
            post_id = post_id_map.get(post_source_id)
            if not post_id:
                continue

            source_id_raw = row.get('source_id')
            try:
                source_id = int(source_id_raw)
            except (TypeError, ValueError):
                source_id = 0

            if source_id > 0:
                existing_by_id = await session.scalar(select(Attachment.id).where(Attachment.id == source_id))
                if existing_by_id is not None:
                    continue

            file_name = str(row.get('file_name', '')).strip()
            mime_type = str(row.get('mime_type', '')).strip() or 'application/octet-stream'
            storage_path = str(row.get('storage_path', '')).strip()
            if not file_name or not storage_path:
                continue

            size_raw = row.get('size')
            size = int(size_raw) if isinstance(size_raw, int) else 0
            created_at = _parse_datetime(str(row.get('created_at', '')).strip() or None)

            exists_stmt = select(Attachment.id).where(
                Attachment.post_id == post_id,
                Attachment.file_name == file_name,
                Attachment.storage_path == storage_path,
            )
            if created_at:
                exists_stmt = exists_stmt.where(Attachment.created_at == created_at)
            exists = await session.scalar(exists_stmt.limit(1))
            if exists is not None:
                continue

            attachment = Attachment(
                id=source_id if source_id > 0 else None,
                post_id=post_id,
                file_name=file_name,
                mime_type=mime_type,
                size=size,
                storage_path=storage_path,
            )
            if created_at:
                attachment.created_at = created_at
            session.add(attachment)

    await session.commit()
    return True


async def _has_non_bootstrap_data(session: AsyncSession) -> bool:
    checks = [
        select(Board.id).limit(1),
        select(MenuCategory.id).limit(1),
        select(Menu.id).limit(1),
        select(Post.id).limit(1),
        select(Comment.id).limit(1),
        select(Attachment.id).limit(1),
        select(UserStatusEvent.id).limit(1),
        select(User.id).where(User.email != DEFAULT_ADMIN_EMAIL).limit(1),
    ]
    for stmt in checks:
        exists = await session.scalar(stmt)
        if exists is not None:
            return True
    return False


async def _seed_test_data(session: AsyncSession) -> None:
    marker_exists = await session.scalar(
        select(Post.id).where(Post.title.like(f'{TEST_DATA_MARKER}%')).limit(1)
    )
    if marker_exists is not None:
        return

    boards = list(await session.scalars(select(Board)))
    board_map = {board.slug: board for board in boards}
    required_slugs = ('notice', 'free', 'archive', 'qa')
    if any(slug not in board_map for slug in required_slugs):
        return

    now = datetime.now(timezone.utc)
    test_password_hash = hash_password(TEST_USER_PASSWORD)

    user_map: dict[str, User] = {}
    for spec in TEST_USER_SPECS:
        email = str(spec['email'])
        existing = await session.scalar(select(User).where(User.email == email))
        if existing is None:
            user = User(
                name=str(spec['name']),
                email=email,
                role=spec['role'],
                is_active=bool(spec['is_active']),
                password_hash=test_password_hash,
                login_count=int(spec['login_count']),
                created_at=_days_ago(now, days=int(spec['created_days_ago'])),
            )
            session.add(user)
            await session.flush()
        else:
            user = existing
            if not user.password_hash:
                user.password_hash = test_password_hash
        user_map[email] = user

        if bool(spec['is_active']):
            continue

        deactivated_days_ago = spec.get('deactivated_days_ago')
        if not isinstance(deactivated_days_ago, int):
            continue

        deactivated_event_exists = await session.scalar(
            select(UserStatusEvent.id)
            .where(
                UserStatusEvent.user_id == user.id,
                UserStatusEvent.event_type == UserStatusEventType.DEACTIVATED,
            )
            .limit(1)
        )
        if deactivated_event_exists is None:
            session.add(
                UserStatusEvent(
                    user_id=user.id,
                    event_type=UserStatusEventType.DEACTIVATED,
                    created_at=_days_ago(now, days=deactivated_days_ago, hours=2),
                )
            )

    admin = await session.scalar(select(User).where(User.email == DEFAULT_ADMIN_EMAIL))
    authors = [candidate for candidate in [admin, *user_map.values()] if candidate and candidate.is_active]
    if not authors:
        authors = list(user_map.values())
    if not authors:
        await session.commit()
        return

    board_cycle = list(required_slugs)
    for day_offset in range(30):
        posts_per_day = 1 + (day_offset % 3)
        for post_index in range(posts_per_day):
            board_slug = board_cycle[(day_offset + post_index) % len(board_cycle)]
            board = board_map[board_slug]
            author = authors[(day_offset + post_index) % len(authors)]
            created_at = _days_ago(now, days=day_offset, hours=post_index + 1)
            title = f'{TEST_DATA_MARKER} {30 - day_offset:02d}일차 샘플 게시글 {post_index + 1}'
            content = (
                f'{board.name} 게시판 테스트 데이터입니다.\n'
                f'통계 모니터링 화면 검증용 게시글 (day={day_offset}, idx={post_index}).'
            )
            post = Post(
                board_id=board.id,
                title=title,
                content=content,
                author_id=author.id,
                is_pinned=board_slug == 'notice' and post_index == 0 and day_offset % 8 == 0,
                view_count=30 + (29 - day_offset) * 3 + post_index * 2,
                created_at=created_at,
                updated_at=created_at,
            )
            session.add(post)
            await session.flush()

            comments_per_post = (day_offset + post_index) % 4
            for comment_index in range(comments_per_post):
                comment_author = authors[(day_offset + post_index + comment_index + 1) % len(authors)]
                comment_created_at = created_at + timedelta(hours=comment_index + 1)
                session.add(
                    Comment(
                        post_id=post.id,
                        author_id=comment_author.id,
                        content=f'테스트 댓글 {comment_index + 1} (post={post.id})',
                        created_at=comment_created_at,
                        updated_at=comment_created_at,
                    )
                )

    await session.commit()


async def seed_initial_data(session: AsyncSession) -> None:
    admin = await session.scalar(select(User).where(User.email == DEFAULT_ADMIN_EMAIL))
    if admin is None:
        session.add(
            User(
                name=DEFAULT_ADMIN_NAME,
                email=DEFAULT_ADMIN_EMAIL,
                role=UserRole.ADMIN,
                is_active=True,
                password_hash=hash_password(DEFAULT_ADMIN_PASSWORD),
            )
        )
    else:
        if admin.role != UserRole.ADMIN:
            admin.role = UserRole.ADMIN
        if not admin.is_active:
            admin.is_active = True
        if not admin.password_hash:
            admin.password_hash = hash_password(DEFAULT_ADMIN_PASSWORD)

    if await _has_non_bootstrap_data(session):
        await session.commit()
        return

    await session.commit()

    snapshot_seeded = await _seed_snapshot_data(session)
    if snapshot_seeded:
        return

    for board_data in DEFAULT_BOARDS:
        exists = await session.scalar(select(Board).where(Board.slug == board_data['slug']))
        if exists is None:
            session.add(Board(**board_data))

    category_map: dict[str, MenuCategory] = {}
    for category_data in DEFAULT_MENU_CATEGORIES:
        category = await session.scalar(select(MenuCategory).where(MenuCategory.label == category_data['label']))
        if category is None:
            category = MenuCategory(**category_data)
            session.add(category)
            await session.flush()
        else:
            if category.order != category_data['order']:
                category.order = category_data['order']
            if category.is_visible != category_data['is_visible']:
                category.is_visible = category_data['is_visible']
        category_map[category.label] = category

    for menu_data in DEFAULT_MENUS:
        category = category_map.get(menu_data['category_label'])
        payload = {
            'label': menu_data['label'],
            'icon': menu_data.get('icon'),
            'type': menu_data['type'],
            'target': menu_data['target'],
            'order': menu_data['order'],
            'is_visible': menu_data['is_visible'],
            'is_admin_only': menu_data['is_admin_only'],
            'read_roles': menu_data['read_roles'],
            'write_roles': menu_data['write_roles'],
            'category_id': category.id if category else None,
        }
        exists = await session.scalar(select(Menu).where(Menu.target == menu_data['target']))
        if exists is None:
            session.add(Menu(**payload))
        else:
            if payload['is_admin_only'] and not exists.is_admin_only:
                exists.is_admin_only = True
            if exists.category_id is None and payload['category_id'] is not None:
                exists.category_id = payload['category_id']
            if (exists.icon is None or not str(exists.icon).strip()) and payload['icon']:
                exists.icon = payload['icon']
            if not exists.read_roles:
                exists.read_roles = payload['read_roles']
            if not exists.write_roles:
                exists.write_roles = payload['write_roles']

    await session.commit()

    if settings.seed_test_data:
        await _seed_test_data(session)
