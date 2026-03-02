from fastapi import APIRouter, status

from app.core.deps import CurrentUserDep, SessionDep
from app.core.exceptions import AppException
from app.crud.comment import get_comment_by_id, list_comments_by_post_id
from app.crud.post import get_post_by_id
from app.models.comment import Comment
from app.schemas.comment import CommentAuthor, CommentCreateRequest, CommentListResponse, CommentOut, CommentUpdateRequest
from app.services.access_control import ensure_read_permission, ensure_write_permission

router = APIRouter(tags=['comments'])



def _can_manage_comment(comment: Comment, user_id: int, user_role: str) -> bool:
    return comment.author_id == user_id or user_role == 'ADMIN'


@router.get('/posts/{post_id}/comments', response_model=CommentListResponse)
async def get_comments(post_id: int, user: CurrentUserDep, session: SessionDep) -> CommentListResponse:
    post = await get_post_by_id(session, post_id)
    if post is None:
        raise AppException('Post not found', 'POST_NOT_FOUND', 404)
    await ensure_read_permission(session, target=f'/boards/{post.board.slug}', role=user.role)

    comments = await list_comments_by_post_id(session, post_id)
    return CommentListResponse(
        items=[
            CommentOut(
                id=comment.id,
                post_id=comment.post_id,
                content=comment.content,
                author=CommentAuthor(id=comment.author.id, name=comment.author.name),
                created_at=comment.created_at,
                updated_at=comment.updated_at,
            )
            for comment in comments
        ]
    )


@router.post('/posts/{post_id}/comments', response_model=CommentOut, status_code=status.HTTP_201_CREATED)
async def create_comment(
    post_id: int,
    payload: CommentCreateRequest,
    user: CurrentUserDep,
    session: SessionDep,
) -> CommentOut:
    post = await get_post_by_id(session, post_id)
    if post is None:
        raise AppException('Post not found', 'POST_NOT_FOUND', 404)
    await ensure_write_permission(session, target=f'/boards/{post.board.slug}', role=user.role)

    comment = Comment(post_id=post_id, author_id=user.id, content=payload.content)
    session.add(comment)
    await session.commit()
    await session.refresh(comment)

    return CommentOut(
        id=comment.id,
        post_id=comment.post_id,
        content=comment.content,
        author=CommentAuthor(id=user.id, name=user.name),
        created_at=comment.created_at,
        updated_at=comment.updated_at,
    )


@router.patch('/comments/{comment_id}', response_model=CommentOut)
async def update_comment(
    comment_id: int,
    payload: CommentUpdateRequest,
    user: CurrentUserDep,
    session: SessionDep,
) -> CommentOut:
    comment = await get_comment_by_id(session, comment_id)
    if comment is None:
        raise AppException('Comment not found', 'COMMENT_NOT_FOUND', 404)

    await ensure_write_permission(session, target=f'/boards/{comment.post.board.slug}', role=user.role)

    if not _can_manage_comment(comment, user.id, user.role.value):
        raise AppException('No permission', 'FORBIDDEN', 403)

    comment.content = payload.content
    await session.commit()
    await session.refresh(comment)

    author_name = comment.author.name if comment.author else user.name
    return CommentOut(
        id=comment.id,
        post_id=comment.post_id,
        content=comment.content,
        author=CommentAuthor(id=comment.author_id, name=author_name),
        created_at=comment.created_at,
        updated_at=comment.updated_at,
    )


@router.delete('/comments/{comment_id}', status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(comment_id: int, user: CurrentUserDep, session: SessionDep) -> None:
    comment = await get_comment_by_id(session, comment_id)
    if comment is None:
        raise AppException('Comment not found', 'COMMENT_NOT_FOUND', 404)

    await ensure_write_permission(session, target=f'/boards/{comment.post.board.slug}', role=user.role)

    if not _can_manage_comment(comment, user.id, user.role.value):
        raise AppException('No permission', 'FORBIDDEN', 403)

    await session.delete(comment)
    await session.commit()
