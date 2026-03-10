from fastapi import APIRouter, Request
from sqlalchemy import select

from app.core.deps import CurrentUserDep, SessionDep
from app.core.exceptions import AppException
from app.core.request_meta import get_client_ip
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User, UserRole
from app.schemas.auth import LoginRequest, LoginResponse, SignupRequest
from app.schemas.user import UserOut
from app.services.auth_throttle import (
    build_login_throttle_key,
    check_login_allowed,
    record_login_failure,
    record_login_success,
)

router = APIRouter(prefix='/auth', tags=['auth'])


@router.post('/signup', response_model=LoginResponse)
async def signup(payload: SignupRequest, session: SessionDep) -> LoginResponse:
    email = payload.email.lower().strip()
    existing = await session.scalar(select(User).where(User.email == email))

    if existing is not None:
        raise AppException('Email already exists', 'EMAIL_ALREADY_EXISTS', 409)

    user = User(
        name=payload.name.strip(),
        email=email,
        role=UserRole.USER,
        is_active=True,
        password_hash=hash_password(payload.password),
        login_count=1,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)

    token = create_access_token(str(user.id), user.role.value)
    return LoginResponse(user=UserOut.model_validate(user), token=token)


@router.post('/login', response_model=LoginResponse)
async def login(payload: LoginRequest, session: SessionDep, request: Request) -> LoginResponse:
    email = payload.email.lower().strip()
    throttle_key = build_login_throttle_key(email, get_client_ip(request) or '')

    retry_after = await check_login_allowed(throttle_key)
    if retry_after is not None:
        raise AppException(
            f'Too many login attempts. Please retry after {retry_after} seconds.',
            'TOO_MANY_LOGIN_ATTEMPTS',
            429,
        )

    user = await session.scalar(select(User).where(User.email == email))

    if user is None:
        await record_login_failure(throttle_key)
        raise AppException('Invalid email or password', 'INVALID_CREDENTIALS', 401)

    if not user.is_active:
        await record_login_failure(throttle_key)
        raise AppException('Inactive user', 'USER_INACTIVE', 403)

    if not user.password_hash:
        await record_login_failure(throttle_key)
        raise AppException('Password is not set for this account', 'PASSWORD_NOT_SET', 400)

    if not verify_password(payload.password, user.password_hash):
        await record_login_failure(throttle_key)
        raise AppException('Invalid email or password', 'INVALID_CREDENTIALS', 401)

    await record_login_success(throttle_key)
    user.login_count += 1
    await session.commit()
    await session.refresh(user)

    token = create_access_token(str(user.id), user.role.value)
    return LoginResponse(user=UserOut.model_validate(user), token=token)


@router.get('/me', response_model=UserOut)
async def me(user: CurrentUserDep) -> UserOut:
    return UserOut.model_validate(user)
