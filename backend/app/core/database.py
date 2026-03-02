from collections.abc import AsyncGenerator

from sqlalchemy import inspect, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings
from app.models.base import Base


engine = create_async_engine(settings.database_url, future=True)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session



def _sync_patch_menu_schema(connection) -> None:
    inspector = inspect(connection)
    table_names = set(inspector.get_table_names())
    if 'menus' not in table_names:
        return

    existing_columns = {column['name'] for column in inspector.get_columns('menus')}

    if 'category_id' not in existing_columns:
        connection.execute(text('ALTER TABLE menus ADD COLUMN category_id INTEGER'))

    if 'is_admin_only' not in existing_columns:
        connection.execute(text('ALTER TABLE menus ADD COLUMN is_admin_only BOOLEAN NOT NULL DEFAULT 0'))

    if 'read_roles' not in existing_columns:
        connection.execute(text('ALTER TABLE menus ADD COLUMN read_roles VARCHAR(100)'))

    if 'write_roles' not in existing_columns:
        connection.execute(text('ALTER TABLE menus ADD COLUMN write_roles VARCHAR(100)'))

    if 'icon' not in existing_columns:
        connection.execute(text('ALTER TABLE menus ADD COLUMN icon VARCHAR(100)'))

    connection.execute(text('CREATE INDEX IF NOT EXISTS ix_menus_category_id ON menus (category_id)'))

    connection.execute(
        text(
            "UPDATE menus SET is_admin_only = 1 "
            "WHERE target IN ('/admin/boards', '/admin/menus', '/admin/users', '/admin/audit-logs', '/stats/monitoring')"
        )
    )

    connection.execute(
        text(
            "UPDATE menus SET read_roles = "
            "CASE WHEN is_admin_only = 1 THEN 'ADMIN' ELSE 'USER,STAFF,ADMIN' END "
            "WHERE read_roles IS NULL OR trim(read_roles) = ''"
        )
    )
    connection.execute(
        text(
            "UPDATE menus SET write_roles = "
            "CASE WHEN is_admin_only = 1 THEN 'ADMIN' ELSE 'STAFF,ADMIN' END "
            "WHERE write_roles IS NULL OR trim(write_roles) = ''"
        )
    )

    connection.execute(
        text(
            "UPDATE menus SET icon = CASE target "
            "WHEN '/dashboard' THEN 'layout-dashboard' "
            "WHEN '/boards/notice' THEN 'bell' "
            "WHEN '/boards/free' THEN 'users' "
            "WHEN '/boards/archive' THEN 'folder-kanban' "
            "WHEN '/boards/qa' THEN 'help-circle' "
            "WHEN '/stats/monitoring' THEN 'chart-column' "
            "WHEN '/admin/boards' THEN 'layout-grid' "
            "WHEN '/admin/menus' THEN 'menu-square' "
            "WHEN '/admin/users' THEN 'users-round' "
            "WHEN '/admin/audit-logs' THEN 'activity' "
            "ELSE icon END "
            "WHERE icon IS NULL OR trim(icon) = ''"
        )
    )


def _sync_patch_user_schema(connection) -> None:
    inspector = inspect(connection)
    table_names = set(inspector.get_table_names())
    if 'users' not in table_names:
        return

    existing_columns = {column['name'] for column in inspector.get_columns('users')}

    if 'password_hash' not in existing_columns:
        connection.execute(text('ALTER TABLE users ADD COLUMN password_hash VARCHAR(255)'))

    if 'login_count' not in existing_columns:
        connection.execute(text('ALTER TABLE users ADD COLUMN login_count INTEGER NOT NULL DEFAULT 0'))


async def init_db() -> None:
    import app.models  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.run_sync(_sync_patch_menu_schema)
        await conn.run_sync(_sync_patch_user_schema)
