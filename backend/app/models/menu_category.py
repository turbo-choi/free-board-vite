from __future__ import annotations

from sqlalchemy import Boolean, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class MenuCategory(Base):
    __tablename__ = 'menu_categories'

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    label: Mapped[str] = mapped_column(String(100), nullable=False, unique=True, index=True)
    order: Mapped[int] = mapped_column(Integer, default=0, nullable=False, index=True)
    is_visible: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    menus = relationship('Menu', back_populates='category')
