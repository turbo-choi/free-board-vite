from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, UserRole


async def list_users(
    session: AsyncSession,
    q: str | None,
    page: int,
    size: int,
) -> tuple[list[User], int]:
    stmt = select(User)
    count_stmt = select(func.count(User.id))

    if q:
        keyword = f"%{q.strip()}%"
        condition = or_(User.name.ilike(keyword), User.email.ilike(keyword))
        stmt = stmt.where(condition)
        count_stmt = count_stmt.where(condition)

    stmt = stmt.order_by(User.created_at.desc()).offset((page - 1) * size).limit(size)
    users = list(await session.scalars(stmt))
    total = await session.scalar(count_stmt) or 0
    return users, total


async def get_user_by_email(session: AsyncSession, email: str) -> User | None:
    return await session.scalar(select(User).where(User.email == email))


async def get_user_by_id(session: AsyncSession, user_id: int) -> User | None:
    return await session.scalar(select(User).where(User.id == user_id))


async def count_active_admins(session: AsyncSession) -> int:
    return int(
        await session.scalar(
            select(func.count(User.id)).where(
                User.role == UserRole.ADMIN,
                User.is_active.is_(True),
            )
        )
        or 0
    )
