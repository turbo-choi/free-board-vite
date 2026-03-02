from pydantic import BaseModel


class ErrorResponse(BaseModel):
    message: str
    code: str


class Pagination(BaseModel):
    total: int
    page: int
    size: int
