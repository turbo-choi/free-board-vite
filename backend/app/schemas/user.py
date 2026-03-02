from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from app.models.user import UserRole


class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: UserRole
    is_active: bool
    created_at: datetime

    model_config = {'from_attributes': True}


class UserListResponse(BaseModel):
    items: list[UserOut]
    total: int
    page: int
    size: int


class UserRoleUpdateRequest(BaseModel):
    role: UserRole


class UserActiveUpdateRequest(BaseModel):
    is_active: bool = Field(...)


class MyProfileStats(BaseModel):
    login_count: int
    post_count: int
    comment_count: int


class MyProfileResponse(BaseModel):
    user: UserOut
    stats: MyProfileStats


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(min_length=4, max_length=100)
    new_password: str = Field(min_length=8, max_length=100)
