from fastapi import APIRouter
from sqlalchemy import select

from app.core.deps import CurrentUserDep, SessionDep
from app.core.exceptions import AppException
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User, UserRole
from app.schemas.auth import LoginRequest, LoginResponse, SignupRequest
from app.schemas.user import UserOut

router = APIRouter(prefix='/auth', tags=['auth'])


@router.post('/signup', response_model=LoginResponse)
async def signup(payload: SignupRequest, session: SessionDep) -> LoginResponse:
    email = payload.email.lower().strip()
    existing = await session.scalar(select(User).where(User.email == email))

    if existing is None:
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
    else:
        if existing.password_hash:
            raise AppException('Email already exists', 'EMAIL_ALREADY_EXISTS', 409)
        existing.name = payload.name.strip()
        existing.password_hash = hash_password(payload.password)
        existing.is_active = True
        if existing.login_count == 0:
            existing.login_count = 1
        await session.commit()
        await session.refresh(existing)
        user = existing

    token = create_access_token(str(user.id), user.role.value)
    return LoginResponse(user=UserOut.model_validate(user), token=token)


@router.post('/login', response_model=LoginResponse)
async def login(payload: LoginRequest, session: SessionDep) -> LoginResponse:
    email = payload.email.lower().strip()
    user = await session.scalar(select(User).where(User.email == email))

    if user is None:
        raise AppException('Invalid email or password', 'INVALID_CREDENTIALS', 401)

    if not user.is_active:
        raise AppException('Inactive user', 'USER_INACTIVE', 403)

    if not user.password_hash:
        raise AppException('Password is not set for this account', 'PASSWORD_NOT_SET', 400)

    if not verify_password(payload.password, user.password_hash):
        raise AppException('Invalid email or password', 'INVALID_CREDENTIALS', 401)

    user.login_count += 1
    await session.commit()
    await session.refresh(user)

    token = create_access_token(str(user.id), user.role.value)
    return LoginResponse(user=UserOut.model_validate(user), token=token)


@router.get('/me', response_model=UserOut)
async def me(user: CurrentUserDep) -> UserOut:
    return UserOut.model_validate(user)
