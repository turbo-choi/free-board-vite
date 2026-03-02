from __future__ import annotations

import asyncio
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import select

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from app.core.database import AsyncSessionLocal
from app.models.attachment import Attachment
from app.models.board import Board
from app.models.comment import Comment
from app.models.menu import Menu
from app.models.menu_category import MenuCategory
from app.models.post import Post
from app.models.user import User
from app.models.user_status_event import UserStatusEvent

SNAPSHOT_PATH = ROOT_DIR / 'app' / 'services' / 'seed_snapshot.json'


def _to_iso(value: datetime | None) -> str | None:
    if value is None:
        return None
    return value.isoformat()


async def export_seed_snapshot() -> dict[str, int]:
    async with AsyncSessionLocal() as session:
        users = list(await session.scalars(select(User).order_by(User.created_at.asc(), User.id.asc())))
        boards = list(await session.scalars(select(Board).order_by(Board.id.asc())))
        menu_categories = list(
            await session.scalars(
                select(MenuCategory).order_by(MenuCategory.order.asc(), MenuCategory.id.asc())
            )
        )
        menus = list(await session.scalars(select(Menu).order_by(Menu.order.asc(), Menu.id.asc())))
        posts = list(await session.scalars(select(Post).order_by(Post.id.asc())))
        comments = list(await session.scalars(select(Comment).order_by(Comment.id.asc())))
        attachments = list(await session.scalars(select(Attachment).order_by(Attachment.id.asc())))
        status_events = list(await session.scalars(select(UserStatusEvent).order_by(UserStatusEvent.id.asc())))

    board_slug_by_id = {board.id: board.slug for board in boards}
    user_email_by_id = {user.id: user.email.lower() for user in users}
    category_label_by_id = {category.id: category.label for category in menu_categories}

    payload = {
        'meta': {
            'generated_at': datetime.now(timezone.utc).isoformat(),
            'source': 'app.db',
            'version': 1,
        },
        'users': [
            {
                'name': user.name,
                'email': user.email.lower(),
                'role': user.role.value,
                'is_active': bool(user.is_active),
                'password_hash': user.password_hash,
                'login_count': int(user.login_count),
                'created_at': _to_iso(user.created_at),
            }
            for user in users
        ],
        'boards': [
            {
                'name': board.name,
                'slug': board.slug,
                'description': board.description,
                'settings_json': board.settings_json,
                'created_at': _to_iso(board.created_at),
            }
            for board in boards
        ],
        'menu_categories': [
            {
                'label': category.label,
                'order': int(category.order),
                'is_visible': bool(category.is_visible),
            }
            for category in menu_categories
        ],
        'menus': [
            {
                'label': menu.label,
                'icon': menu.icon,
                'type': menu.type,
                'target': menu.target,
                'order': int(menu.order),
                'is_visible': bool(menu.is_visible),
                'category_label': category_label_by_id.get(menu.category_id),
                'is_admin_only': bool(menu.is_admin_only),
                'read_roles': menu.read_roles,
                'write_roles': menu.write_roles,
            }
            for menu in menus
        ],
        'posts': [
            {
                'source_id': post.id,
                'board_slug': board_slug_by_id.get(post.board_id),
                'author_email': user_email_by_id.get(post.author_id),
                'title': post.title,
                'content': post.content,
                'is_pinned': bool(post.is_pinned),
                'view_count': int(post.view_count),
                'created_at': _to_iso(post.created_at),
                'updated_at': _to_iso(post.updated_at),
            }
            for post in posts
        ],
        'comments': [
            {
                'source_id': comment.id,
                'post_source_id': comment.post_id,
                'author_email': user_email_by_id.get(comment.author_id),
                'content': comment.content,
                'created_at': _to_iso(comment.created_at),
                'updated_at': _to_iso(comment.updated_at),
            }
            for comment in comments
        ],
        'attachments': [
            {
                'source_id': attachment.id,
                'post_source_id': attachment.post_id,
                'file_name': attachment.file_name,
                'mime_type': attachment.mime_type,
                'size': int(attachment.size),
                'storage_path': attachment.storage_path,
                'created_at': _to_iso(attachment.created_at),
            }
            for attachment in attachments
        ],
        'user_status_events': [
            {
                'user_email': user_email_by_id.get(event.user_id),
                'event_type': event.event_type.value,
                'created_at': _to_iso(event.created_at),
            }
            for event in status_events
        ],
    }

    SNAPSHOT_PATH.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding='utf-8',
    )

    return {
        'users': len(payload['users']),
        'boards': len(payload['boards']),
        'menu_categories': len(payload['menu_categories']),
        'menus': len(payload['menus']),
        'posts': len(payload['posts']),
        'comments': len(payload['comments']),
        'attachments': len(payload['attachments']),
        'user_status_events': len(payload['user_status_events']),
    }


if __name__ == '__main__':
    result = asyncio.run(export_seed_snapshot())
    print(f'Wrote snapshot: {SNAPSHOT_PATH}')
    print(result)
