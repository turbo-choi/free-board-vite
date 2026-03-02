from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.comment import Comment
from app.models.post import Post


async def list_comments_by_post_id(session: AsyncSession, post_id: int) -> list[Comment]:
    result = await session.scalars(
        select(Comment)
        .where(Comment.post_id == post_id)
        .options(joinedload(Comment.author))
        .order_by(Comment.created_at.asc())
    )
    return list(result)


async def get_comment_by_id(session: AsyncSession, comment_id: int) -> Comment | None:
    return await session.scalar(
        select(Comment)
        .where(Comment.id == comment_id)
        .options(joinedload(Comment.author), joinedload(Comment.post).joinedload(Post.board))
    )
