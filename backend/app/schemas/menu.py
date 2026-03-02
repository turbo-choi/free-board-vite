from pydantic import BaseModel, Field

from app.models.user import UserRole


class MenuCategoryCreateRequest(BaseModel):
    label: str = Field(min_length=1, max_length=100)
    order: int = 0
    is_visible: bool = True


class MenuCategoryOut(BaseModel):
    id: int
    label: str
    order: int
    is_visible: bool

    model_config = {'from_attributes': True}


class MenuCategoryListResponse(BaseModel):
    items: list[MenuCategoryOut]


class MenuCategoryReorderItem(BaseModel):
    id: int
    order: int


class MenuCategoryReorderRequest(BaseModel):
    items: list[MenuCategoryReorderItem]


class MenuCreateRequest(BaseModel):
    label: str = Field(min_length=1, max_length=100)
    icon: str | None = Field(default=None, min_length=1, max_length=100)
    type: str = Field(min_length=1, max_length=50)
    target: str = Field(min_length=1, max_length=255)
    order: int = 0
    is_visible: bool = True
    category_id: int | None = None
    is_admin_only: bool = False
    read_roles: list[UserRole] | None = None
    write_roles: list[UserRole] | None = None


class MenuUpdateRequest(BaseModel):
    label: str | None = Field(default=None, min_length=1, max_length=100)
    icon: str | None = Field(default=None, min_length=1, max_length=100)
    type: str | None = Field(default=None, min_length=1, max_length=50)
    target: str | None = Field(default=None, min_length=1, max_length=255)
    order: int | None = None
    is_visible: bool | None = None
    category_id: int | None = None
    is_admin_only: bool | None = None
    read_roles: list[UserRole] | None = None
    write_roles: list[UserRole] | None = None


class MenuOut(BaseModel):
    id: int
    label: str
    icon: str | None
    type: str
    target: str
    order: int
    is_visible: bool
    category_id: int | None
    category_label: str | None
    is_admin_only: bool
    read_roles: list[UserRole]
    write_roles: list[UserRole]


class MenuListResponse(BaseModel):
    items: list[MenuOut]


class MenuReorderItem(BaseModel):
    id: int
    order: int


class MenuReorderRequest(BaseModel):
    items: list[MenuReorderItem]


class NavigationMenuItem(BaseModel):
    id: int
    label: str
    icon: str | None
    type: str
    target: str
    order: int
    category_id: int | None
    can_write: bool


class NavigationMenuGroup(BaseModel):
    category_id: int | None
    category_label: str
    order: int
    items: list[NavigationMenuItem]


class NavigationMenuResponse(BaseModel):
    groups: list[NavigationMenuGroup]
