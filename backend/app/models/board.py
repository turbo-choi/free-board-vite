from __future__ import annotations

from sqlalchemy import JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class Board(TimestampMixin, Base):
    __tablename__ = 'boards'

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(80), nullable=False)
    slug: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    settings_json: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)

    posts = relationship('Post', back_populates='board', cascade='all, delete-orphan')
