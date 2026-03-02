from datetime import datetime, time

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload

from app.models.board import Board
from app.models.comment import Comment
from app.models.post import Post
from app.models.user import User
from app.schemas.post import PostDetail, PostListItem, PostListQuery, PostSort



def _apply_post_filters(stmt, query: PostListQuery):
    if query.boardSlug:
        stmt = stmt.where(Board.slug == query.boardSlug)

    if query.q:
        keyword = f"%{query.q.strip()}%"
        stmt = stmt.where(
            or_(
                Post.title.ilike(keyword),
                Post.content.ilike(keyword),
                User.name.ilike(keyword),
            )
        )

    if query.from_date:
        stmt = stmt.where(Post.created_at >= datetime.combine(query.from_date, time.min))

    if query.to_date:
        stmt = stmt.where(Post.created_at <= datetime.combine(query.to_date, time.max))

    return stmt


async def list_posts(session: AsyncSession, query: PostListQuery) -> tuple[list[PostListItem], int]:
    comment_count_sq = (
        select(Comment.post_id, func.count(Comment.id).label('comment_count'))
        .group_by(Comment.post_id)
        .subquery()
    )

    total_stmt = select(func.count(Post.id)).join(Board, Post.board_id == Board.id).join(User, Post.author_id == User.id)
    total_stmt = _apply_post_filters(total_stmt, query)
    total = await session.scalar(total_stmt) or 0

    stmt = (
        select(
            Post,
            Board.slug.label('board_slug'),
            Board.name.label('board_name'),
            User.name.label('author_name'),
            func.coalesce(comment_count_sq.c.comment_count, 0).label('comment_count'),
        )
        .join(Board, Post.board_id == Board.id)
        .join(User, Post.author_id == User.id)
        .outerjoin(comment_count_sq, comment_count_sq.c.post_id == Post.id)
    )
    stmt = _apply_post_filters(stmt, query)

    order_clauses = [Post.is_pinned.desc()]
    if query.sort == PostSort.view:
        order_clauses.append(Post.view_count.desc())
    elif query.sort == PostSort.comment:
        order_clauses.append(func.coalesce(comment_count_sq.c.comment_count, 0).desc())
    else:
        order_clauses.append(Post.created_at.desc())
    order_clauses.append(Post.id.desc())

    stmt = (
        stmt.order_by(*order_clauses)
        .offset((query.page - 1) * query.size)
        .limit(query.size)
    )

    rows = (await session.execute(stmt)).all()

    items = [
        PostListItem(
            id=post.id,
            board_id=post.board_id,
            board_slug=board_slug,
            board_name=board_name,
            title=post.title,
            content_preview=post.content[:180],
            author_id=post.author_id,
            author_name=author_name,
            is_pinned=post.is_pinned,
            view_count=post.view_count,
            comment_count=int(comment_count),
            created_at=post.created_at,
            updated_at=post.updated_at,
        )
        for post, board_slug, board_name, author_name, comment_count in rows
    ]
    return items, total


async def get_post_by_id(session: AsyncSession, post_id: int) -> Post | None:
    stmt = (
        select(Post)
        .where(Post.id == post_id)
        .options(joinedload(Post.board), joinedload(Post.author), selectinload(Post.attachments))
    )
    return await session.scalar(stmt)


async def get_post_detail(session: AsyncSession, post_id: int, increase_view: bool = False) -> PostDetail | None:
    post = await get_post_by_id(session, post_id)
    if post is None:
        return None

    if increase_view:
        post.view_count += 1
        await session.commit()
        await session.refresh(post)

    return PostDetail(
        id=post.id,
        board_id=post.board_id,
        board_slug=post.board.slug,
        board_name=post.board.name,
        title=post.title,
        content=post.content,
        author_id=post.author_id,
        author_name=post.author.name,
        is_pinned=post.is_pinned,
        view_count=post.view_count,
        created_at=post.created_at,
        updated_at=post.updated_at,
        attachments=post.attachments,
    )
