from datetime import date, datetime
from enum import Enum

from pydantic import BaseModel, Field

from app.schemas.attachment import AttachmentOut


class PostSort(str, Enum):
    latest = 'latest'
    view = 'view'
    comment = 'comment'


class PostCreateRequest(BaseModel):
    board_id: int
    title: str = Field(min_length=1, max_length=255)
    content: str = Field(min_length=1)
    is_pinned: bool = False


class PostUpdateRequest(BaseModel):
    board_id: int | None = None
    title: str | None = Field(default=None, min_length=1, max_length=255)
    content: str | None = Field(default=None, min_length=1)
    is_pinned: bool | None = None


class PostListItem(BaseModel):
    id: int
    board_id: int
    board_slug: str
    board_name: str
    title: str
    content_preview: str
    author_id: int
    author_name: str
    is_pinned: bool
    view_count: int
    comment_count: int
    created_at: datetime
    updated_at: datetime


class PostDetail(BaseModel):
    id: int
    board_id: int
    board_slug: str
    board_name: str
    title: str
    content: str
    author_id: int
    author_name: str
    is_pinned: bool
    view_count: int
    created_at: datetime
    updated_at: datetime
    attachments: list[AttachmentOut]


class PostListResponse(BaseModel):
    items: list[PostListItem]
    total: int
    page: int
    size: int


class PostListQuery(BaseModel):
    boardSlug: str | None = None
    q: str | None = None
    sort: PostSort = PostSort.latest
    page: int = Field(default=1, ge=1)
    size: int = Field(default=10, ge=1, le=100)
    from_date: date | None = Field(default=None, alias='from')
    to_date: date | None = Field(default=None, alias='to')
