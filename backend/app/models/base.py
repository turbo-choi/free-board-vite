from datetime import datetime

from sqlalchemy import DateTime
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


def now_system_time() -> datetime:
    # Keep DB values aligned with the host system clock (local time).
    return datetime.now().astimezone().replace(tzinfo=None)


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=False),
        default=now_system_time,
        nullable=False,
    )


class UpdatedTimestampMixin(TimestampMixin):
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=False),
        default=now_system_time,
        onupdate=now_system_time,
        nullable=False,
    )
