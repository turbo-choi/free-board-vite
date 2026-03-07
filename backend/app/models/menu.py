from __future__ import annotations

from sqlalchemy import Boolean, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Menu(Base):
    __tablename__ = 'menus'

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    label: Mapped[str] = mapped_column(String(100), nullable=False)
    icon: Mapped[str | None] = mapped_column(String(100), nullable=True)
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    target: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    order: Mapped[int] = mapped_column(Integer, default=0, nullable=False, index=True)
    is_visible: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    category_id: Mapped[int | None] = mapped_column(
        ForeignKey('menu_categories.id', ondelete='SET NULL'),
        nullable=True,
        index=True,
    )
    is_admin_only: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    read_roles: Mapped[str] = mapped_column(String(100), nullable=False, default='USER,STAFF,ADMIN')
    write_roles: Mapped[str] = mapped_column(String(100), nullable=False, default='STAFF,ADMIN')

    category = relationship('MenuCategory', back_populates='menus')
