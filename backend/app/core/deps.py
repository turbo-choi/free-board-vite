from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.exceptions import AppException
from app.core.security import TokenDecodeError, decode_access_token
from app.models.user import User, UserRole

bearer_scheme = HTTPBearer(auto_error=False)


SessionDep = Annotated[AsyncSession, Depends(get_session)]


async def get_current_user(
    session: SessionDep,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> User:
    if credentials is None:
        raise AppException('Authentication required', 'UNAUTHORIZED', 401)

    try:
        payload = decode_access_token(credentials.credentials)
    except TokenDecodeError:
        raise AppException('Invalid token', 'INVALID_TOKEN', 401)

    subject = payload.get('sub')
    if not subject or not str(subject).isdigit():
        raise AppException('Invalid token payload', 'INVALID_TOKEN', 401)

    user = await session.scalar(select(User).where(User.id == int(subject)))
    if user is None:
        raise AppException('User not found', 'USER_NOT_FOUND', 404)
    if not user.is_active:
        raise AppException('Inactive user', 'USER_INACTIVE', 403)
    return user


CurrentUserDep = Annotated[User, Depends(get_current_user)]


async def require_admin(user: CurrentUserDep) -> User:
    if user.role != UserRole.ADMIN:
        raise AppException('Admin access required', 'FORBIDDEN', 403)
    return user


AdminUserDep = Annotated[User, Depends(require_admin)]
