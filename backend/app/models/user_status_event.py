from __future__ import annotations

import enum

from sqlalchemy import Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class UserStatusEventType(str, enum.Enum):
    ACTIVATED = 'ACTIVATED'
    DEACTIVATED = 'DEACTIVATED'


class UserStatusEvent(TimestampMixin, Base):
    __tablename__ = 'user_status_events'

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id', ondelete='CASCADE'), index=True)
    event_type: Mapped[UserStatusEventType] = mapped_column(Enum(UserStatusEventType), nullable=False)

    user = relationship('User', back_populates='status_events')
