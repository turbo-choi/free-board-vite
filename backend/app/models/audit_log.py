from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, now_system_time
from app.models.user import UserRole


class AuditLog(Base):
    __tablename__ = 'audit_logs'

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey('users.id', ondelete='SET NULL'),
        nullable=True,
        index=True,
    )
    user_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    user_role: Mapped[UserRole | None] = mapped_column(Enum(UserRole), nullable=True)

    method: Mapped[str] = mapped_column(String(10), nullable=False, index=True)
    path: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    query_string: Mapped[str | None] = mapped_column(Text, nullable=True)

    status_code: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    is_success: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, index=True)
    latency_ms: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    ip_address: Mapped[str | None] = mapped_column(String(64), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(300), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=False),
        nullable=False,
        default=now_system_time,
        index=True,
    )

    user = relationship('User', back_populates='audit_logs')
