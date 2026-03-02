from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.attachment import Attachment
from app.models.post import Post


async def get_attachment_by_id(session: AsyncSession, attachment_id: int) -> Attachment | None:
    return await session.scalar(
        select(Attachment)
        .where(Attachment.id == attachment_id)
        .options(joinedload(Attachment.post).joinedload(Post.author), joinedload(Attachment.post).joinedload(Post.board))
    )
