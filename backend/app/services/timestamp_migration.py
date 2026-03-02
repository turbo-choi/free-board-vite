from __future__ import annotations

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

# One-time migration marker stored in SQLite PRAGMA user_version.
SYSTEM_TIME_MIGRATION_VERSION = 1

TIMESTAMP_COLUMNS: dict[str, tuple[str, ...]] = {
    'users': ('created_at',),
    'boards': ('created_at',),
    'posts': ('created_at', 'updated_at'),
    'comments': ('created_at', 'updated_at'),
    'attachments': ('created_at',),
    'user_status_events': ('created_at',),
    'audit_logs': ('created_at',),
}


async def migrate_utc_timestamps_to_system_time(session: AsyncSession) -> bool:
    current_version = int((await session.scalar(text('PRAGMA user_version'))) or 0)
    if current_version >= SYSTEM_TIME_MIGRATION_VERSION:
        return False

    # Existing rows were stored as UTC-naive strings by SQLite CURRENT_TIMESTAMP.
    # Convert them once to system local-time strings.
    for table_name, columns in TIMESTAMP_COLUMNS.items():
        for column_name in columns:
            await session.execute(
                text(
                    f"""
                    UPDATE {table_name}
                    SET {column_name} = strftime('%Y-%m-%d %H:%M:%f', {column_name}, 'localtime')
                    WHERE {column_name} IS NOT NULL
                    """
                )
            )

    await session.execute(text(f'PRAGMA user_version = {SYSTEM_TIME_MIGRATION_VERSION}'))
    await session.commit()
    return True
