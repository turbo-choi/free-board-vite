from datetime import date

from fastapi import APIRouter, Query, status

from app.core.deps import CurrentUserDep, SessionDep
from app.core.exceptions import AppException
from app.crud.board import get_board_by_id
from app.crud.post import get_post_by_id, get_post_detail, list_posts
from app.models.post import Post
from app.models.user import UserRole
from app.schemas.post import PostCreateRequest, PostDetail, PostListQuery, PostListResponse, PostSort, PostUpdateRequest
from app.services.access_control import ensure_read_permission, ensure_write_permission

router = APIRouter(prefix='/posts', tags=['posts'])



def _can_manage_post(post: Post, user_id: int, user_role: str) -> bool:
    return post.author_id == user_id or user_role == 'ADMIN'


@router.get('', response_model=PostListResponse)
async def get_posts(
    user: CurrentUserDep,
    session: SessionDep,
    boardSlug: str | None = Query(default=None),
    q: str | None = Query(default=None),
    sort: PostSort = Query(default=PostSort.latest),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=10, ge=1, le=100),
    from_date: date | None = Query(default=None, alias='from'),
    to_date: date | None = Query(default=None, alias='to'),
) -> PostListResponse:
    if boardSlug:
        await ensure_read_permission(session, target=f'/boards/{boardSlug}', role=user.role)

    query = PostListQuery.model_validate(
        {
            'boardSlug': boardSlug,
            'q': q,
            'sort': sort,
            'page': page,
            'size': size,
            'from': from_date,
            'to': to_date,
        }
    )
    items, total = await list_posts(session, query)
    return PostListResponse(items=items, total=total, page=query.page, size=query.size)


@router.post('', response_model=PostDetail, status_code=status.HTTP_201_CREATED)
async def create_post(payload: PostCreateRequest, user: CurrentUserDep, session: SessionDep) -> PostDetail:
    board = await get_board_by_id(session, payload.board_id)
    if board is None:
        raise AppException('Board not found', 'BOARD_NOT_FOUND', 404)

    await ensure_write_permission(session, target=f'/boards/{board.slug}', role=user.role)

    if payload.is_pinned and not board.settings_json.get('allowPin', False):
        raise AppException('Pin is disabled for this board', 'PIN_DISABLED', 400)
    if payload.is_pinned and user.role not in (UserRole.STAFF, UserRole.ADMIN):
        raise AppException('Pin requires STAFF or ADMIN role', 'PIN_ROLE_FORBIDDEN', 403)

    post = Post(
        board_id=payload.board_id,
        title=payload.title,
        content=payload.content,
        author_id=user.id,
        is_pinned=payload.is_pinned,
    )
    session.add(post)
    await session.commit()

    detail = await get_post_detail(session, post.id, increase_view=False)
    if detail is None:
        raise AppException('Post not found', 'POST_NOT_FOUND', 404)
    return detail


@router.get('/{post_id}', response_model=PostDetail)
async def get_post(post_id: int, user: CurrentUserDep, session: SessionDep) -> PostDetail:
    post = await get_post_by_id(session, post_id)
    if post is None:
        raise AppException('Post not found', 'POST_NOT_FOUND', 404)
    await ensure_read_permission(session, target=f'/boards/{post.board.slug}', role=user.role)

    detail = await get_post_detail(session, post_id, increase_view=True)
    if detail is None:
        raise AppException('Post not found', 'POST_NOT_FOUND', 404)
    return detail


@router.patch('/{post_id}', response_model=PostDetail)
async def update_post(
    post_id: int,
    payload: PostUpdateRequest,
    user: CurrentUserDep,
    session: SessionDep,
) -> PostDetail:
    post = await get_post_by_id(session, post_id)
    if post is None:
        raise AppException('Post not found', 'POST_NOT_FOUND', 404)

    if not _can_manage_post(post, user.id, user.role.value):
        raise AppException('No permission', 'FORBIDDEN', 403)

    await ensure_write_permission(session, target=f'/boards/{post.board.slug}', role=user.role)

    updates = payload.model_dump(exclude_unset=True)

    board = post.board
    if 'board_id' in updates and updates['board_id'] != post.board_id:
        board = await get_board_by_id(session, updates['board_id'])
        if board is None:
            raise AppException('Board not found', 'BOARD_NOT_FOUND', 404)
        await ensure_write_permission(session, target=f'/boards/{board.slug}', role=user.role)

    if updates.get('is_pinned') is True and not board.settings_json.get('allowPin', False):
        raise AppException('Pin is disabled for this board', 'PIN_DISABLED', 400)
    if updates.get('is_pinned') is True and user.role not in (UserRole.STAFF, UserRole.ADMIN):
        raise AppException('Pin requires STAFF or ADMIN role', 'PIN_ROLE_FORBIDDEN', 403)

    for key, value in updates.items():
        setattr(post, key, value)

    await session.commit()

    detail = await get_post_detail(session, post.id, increase_view=False)
    if detail is None:
        raise AppException('Post not found', 'POST_NOT_FOUND', 404)
    return detail


@router.delete('/{post_id}', status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(post_id: int, user: CurrentUserDep, session: SessionDep) -> None:
    post = await get_post_by_id(session, post_id)
    if post is None:
        raise AppException('Post not found', 'POST_NOT_FOUND', 404)

    if not _can_manage_post(post, user.id, user.role.value):
        raise AppException('No permission', 'FORBIDDEN', 403)

    await ensure_write_permission(session, target=f'/boards/{post.board.slug}', role=user.role)

    await session.delete(post)
    await session.commit()
