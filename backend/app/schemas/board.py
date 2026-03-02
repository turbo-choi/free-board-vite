from datetime import datetime

from pydantic import BaseModel, Field


class BoardSettings(BaseModel):
    allowAnonymous: bool = False
    allowAttachment: bool = True
    allowPin: bool = True


class BoardCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    slug: str = Field(min_length=1, max_length=50, pattern=r'^[a-z0-9-]+$')
    description: str | None = Field(default=None, max_length=500)
    settings_json: BoardSettings = Field(default_factory=BoardSettings)


class BoardUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=80)
    slug: str | None = Field(default=None, min_length=1, max_length=50, pattern=r'^[a-z0-9-]+$')
    description: str | None = Field(default=None, max_length=500)
    settings_json: BoardSettings | None = None


class BoardOut(BaseModel):
    id: int
    name: str
    slug: str
    description: str | None
    settings_json: BoardSettings
    created_at: datetime

    model_config = {'from_attributes': True}


class BoardListResponse(BaseModel):
    items: list[BoardOut]
