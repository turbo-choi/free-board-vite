from datetime import datetime

from pydantic import BaseModel, Field


class CommentAuthor(BaseModel):
    id: int
    name: str


class CommentCreateRequest(BaseModel):
    content: str = Field(min_length=1)


class CommentUpdateRequest(BaseModel):
    content: str = Field(min_length=1)


class CommentOut(BaseModel):
    id: int
    post_id: int
    content: str
    author: CommentAuthor
    created_at: datetime
    updated_at: datetime


class CommentListResponse(BaseModel):
    items: list[CommentOut]
