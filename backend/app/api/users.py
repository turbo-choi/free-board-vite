from sqlalchemy import func, select
from fastapi import APIRouter, Query

from app.core.deps import CurrentUserDep, SessionDep
from app.core.exceptions import AppException
from app.core.security import hash_password, verify_password
from app.crud.user import count_active_admins, get_user_by_id, list_users
from app.models.comment import Comment
from app.models.post import Post
from app.models.user import UserRole
from app.models.user_status_event import UserStatusEvent, UserStatusEventType
from app.schemas.user import (
    ChangePasswordRequest,
    MyProfileResponse,
    MyProfileStats,
    UserActiveUpdateRequest,
    UserListResponse,
    UserOut,
    UserRoleUpdateRequest,
)
from app.services.access_control import ensure_read_permission, ensure_write_permission

router = APIRouter(prefix='/users', tags=['users'])


@router.get('/me/profile', response_model=MyProfileResponse)
async def get_my_profile(user: CurrentUserDep, session: SessionDep) -> MyProfileResponse:
    post_count = await session.scalar(select(func.count(Post.id)).where(Post.author_id == user.id)) or 0
    comment_count = (
        await session.scalar(select(func.count(Comment.id)).where(Comment.author_id == user.id)) or 0
    )
    return MyProfileResponse(
        user=UserOut.model_validate(user),
        stats=MyProfileStats(
            login_count=user.login_count,
            post_count=post_count,
            comment_count=comment_count,
        ),
    )


@router.patch('/me/password', status_code=204)
async def change_my_password(
    payload: ChangePasswordRequest,
    user: CurrentUserDep,
    session: SessionDep,
) -> None:
    if user.password_hash and not verify_password(payload.current_password, user.password_hash):
        raise AppException('Current password is invalid', 'INVALID_PASSWORD', 400)
    user.password_hash = hash_password(payload.new_password)
    await session.commit()


@router.delete('/me/withdraw', status_code=204)
async def withdraw_my_account(user: CurrentUserDep, session: SessionDep) -> None:
    was_active = user.is_active
    if user.role == UserRole.ADMIN and was_active and await count_active_admins(session) <= 1:
        raise AppException(
            'At least one active admin must remain',
            'LAST_ACTIVE_ADMIN_REQUIRED',
            400,
        )
    user.is_active = False
    if was_active:
        session.add(UserStatusEvent(user_id=user.id, event_type=UserStatusEventType.DEACTIVATED))
    await session.commit()


@router.get('', response_model=UserListResponse)
async def get_users(
    user: CurrentUserDep,
    session: SessionDep,
    q: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=10, ge=1, le=100),
) -> UserListResponse:
    await ensure_read_permission(session, target='/admin/users', role=user.role)
    users, total = await list_users(session, q, page, size)
    return UserListResponse(
        items=[UserOut.model_validate(user) for user in users],
        total=total,
        page=page,
        size=size,
    )


@router.patch('/{user_id}/role', response_model=UserOut)
async def update_user_role(
    user_id: int,
    payload: UserRoleUpdateRequest,
    current_user: CurrentUserDep,
    session: SessionDep,
) -> UserOut:
    await ensure_write_permission(session, target='/admin/users', role=current_user.role)
    target_user = await get_user_by_id(session, user_id)
    if target_user is None:
        raise AppException('User not found', 'USER_NOT_FOUND', 404)

    if (
        target_user.role == UserRole.ADMIN
        and payload.role != UserRole.ADMIN
        and target_user.is_active
        and await count_active_admins(session) <= 1
    ):
        raise AppException(
            'At least one active admin must remain',
            'LAST_ACTIVE_ADMIN_REQUIRED',
            400,
        )

    target_user.role = payload.role
    await session.commit()
    await session.refresh(target_user)
    return UserOut.model_validate(target_user)


@router.patch('/{user_id}/active', response_model=UserOut)
async def update_user_active(
    user_id: int,
    payload: UserActiveUpdateRequest,
    current_user: CurrentUserDep,
    session: SessionDep,
) -> UserOut:
    await ensure_write_permission(session, target='/admin/users', role=current_user.role)
    user = await get_user_by_id(session, user_id)
    if user is None:
        raise AppException('User not found', 'USER_NOT_FOUND', 404)

    if user.id == current_user.id and not payload.is_active:
        raise AppException('You cannot deactivate yourself', 'CANNOT_DEACTIVATE_SELF', 400)

    if (
        user.role == UserRole.ADMIN
        and user.is_active
        and not payload.is_active
        and await count_active_admins(session) <= 1
    ):
        raise AppException(
            'At least one active admin must remain',
            'LAST_ACTIVE_ADMIN_REQUIRED',
            400,
        )

    if user.is_active != payload.is_active:
        event_type = (
            UserStatusEventType.ACTIVATED if payload.is_active else UserStatusEventType.DEACTIVATED
        )
        session.add(UserStatusEvent(user_id=user.id, event_type=event_type))

    user.is_active = payload.is_active
    await session.commit()
    await session.refresh(user)
    return UserOut.model_validate(user)
