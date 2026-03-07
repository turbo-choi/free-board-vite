from datetime import date, datetime, time, timedelta
from typing import Annotated

from fastapi import APIRouter, Query
from sqlalchemy import func, select

from app.core.deps import CurrentUserDep, SessionDep
from app.core.exceptions import AppException
from app.models.board import Board
from app.models.comment import Comment
from app.models.post import Post
from app.models.user import User
from app.models.user_status_event import UserStatusEvent, UserStatusEventType
from app.schemas.stats import (
    BoardPostCountOut,
    DashboardStatsOut,
    DailyStatsOut,
    StatsMonitoringResponse,
    StatsSummary,
)
from app.services.access_control import ensure_read_permission, list_readable_boards

router = APIRouter(prefix='/stats', tags=['stats'])


def _to_day_counts(rows: list[tuple[date | str, int]]) -> dict[date, int]:
    counts: dict[date, int] = {}
    for raw_day, raw_count in rows:
        day = raw_day if isinstance(raw_day, date) else date.fromisoformat(str(raw_day))
        counts[day] = int(raw_count)
    return counts


@router.get('/dashboard', response_model=DashboardStatsOut)
async def get_dashboard_stats(user: CurrentUserDep, session: SessionDep) -> DashboardStatsOut:
    readable_boards = await list_readable_boards(session, role=user.role)
    if not readable_boards:
        return DashboardStatsOut(
            today_posts=0,
            today_comments=0,
            unanswered_qa_count=0,
            pinned_notice_count=0,
        )

    readable_board_ids = [board.id for board in readable_boards]
    board_slug_to_id = {board.slug: board.id for board in readable_boards}

    today = date.today()
    today_start = datetime.combine(today, time.min)
    today_end = datetime.combine(today, time.max)

    comment_count_sq = (
        select(Comment.post_id, func.count(Comment.id).label('comment_count'))
        .group_by(Comment.post_id)
        .subquery()
    )

    today_posts = int(
        await session.scalar(
            select(func.count(Post.id)).where(
                Post.board_id.in_(readable_board_ids),
                Post.created_at >= today_start,
                Post.created_at <= today_end,
            )
        )
        or 0
    )
    today_comments = int(
        await session.scalar(
            select(func.coalesce(func.sum(func.coalesce(comment_count_sq.c.comment_count, 0)), 0))
            .select_from(Post)
            .outerjoin(comment_count_sq, comment_count_sq.c.post_id == Post.id)
            .where(
                Post.board_id.in_(readable_board_ids),
                Post.created_at >= today_start,
                Post.created_at <= today_end,
            )
        )
        or 0
    )

    qa_board_id = board_slug_to_id.get('qa')
    unanswered_qa_count = 0
    if qa_board_id is not None:
        unanswered_qa_count = int(
            await session.scalar(
                select(func.count(Post.id))
                .select_from(Post)
                .outerjoin(comment_count_sq, comment_count_sq.c.post_id == Post.id)
                .where(
                    Post.board_id == qa_board_id,
                    func.coalesce(comment_count_sq.c.comment_count, 0) == 0,
                )
            )
            or 0
        )

    notice_board_id = board_slug_to_id.get('notice')
    pinned_notice_count = 0
    if notice_board_id is not None:
        pinned_notice_count = int(
            await session.scalar(
                select(func.count(Post.id)).where(
                    Post.board_id == notice_board_id,
                    Post.is_pinned.is_(True),
                )
            )
            or 0
        )

    return DashboardStatsOut(
        today_posts=today_posts,
        today_comments=today_comments,
        unanswered_qa_count=unanswered_qa_count,
        pinned_notice_count=pinned_notice_count,
    )


@router.get('/monitoring', response_model=StatsMonitoringResponse)
async def get_stats_monitoring(
    user: CurrentUserDep,
    session: SessionDep,
    days: Annotated[int, Query(ge=1, le=365)] = 30,
    month: Annotated[str | None, Query(pattern=r'^\d{4}-\d{2}$')] = None,
) -> StatsMonitoringResponse:
    await ensure_read_permission(session, target='/stats/monitoring', role=user.role)

    today = date.today()
    if month:
        try:
            parsed_month = datetime.strptime(month, '%Y-%m')
            start_date = date(parsed_month.year, parsed_month.month, 1)
        except ValueError:
            raise AppException('Invalid month format', 'INVALID_MONTH', 422)

        if start_date > today:
            raise AppException('Future month is not allowed', 'FUTURE_MONTH_NOT_ALLOWED', 422)

        next_month = start_date.replace(day=28) + timedelta(days=4)
        end_date = next_month.replace(day=1) - timedelta(days=1)
    else:
        start_date = today - timedelta(days=days - 1)
        end_date = today

    start_date_str = start_date.isoformat()
    end_date_str = end_date.isoformat()

    base_members = int(
        await session.scalar(
            select(func.count(User.id)).where(func.date(User.created_at) < start_date_str)
        )
        or 0
    )

    new_member_rows = (
        await session.execute(
            select(func.date(User.created_at), func.count(User.id))
            .where(
                func.date(User.created_at) >= start_date_str,
                func.date(User.created_at) <= end_date_str,
            )
            .group_by(func.date(User.created_at))
        )
    ).all()
    withdrawn_rows = (
        await session.execute(
            select(func.date(UserStatusEvent.created_at), func.count(UserStatusEvent.id))
            .where(
                UserStatusEvent.event_type == UserStatusEventType.DEACTIVATED,
                func.date(UserStatusEvent.created_at) >= start_date_str,
                func.date(UserStatusEvent.created_at) <= end_date_str,
            )
            .group_by(func.date(UserStatusEvent.created_at))
        )
    ).all()
    post_rows = (
        await session.execute(
            select(func.date(Post.created_at), func.count(Post.id))
            .where(
                func.date(Post.created_at) >= start_date_str,
                func.date(Post.created_at) <= end_date_str,
            )
            .group_by(func.date(Post.created_at))
        )
    ).all()
    comment_rows = (
        await session.execute(
            select(func.date(Comment.created_at), func.count(Comment.id))
            .where(
                func.date(Comment.created_at) >= start_date_str,
                func.date(Comment.created_at) <= end_date_str,
            )
            .group_by(func.date(Comment.created_at))
        )
    ).all()

    new_member_counts = _to_day_counts(new_member_rows)
    withdrawn_counts = _to_day_counts(withdrawn_rows)
    post_counts = _to_day_counts(post_rows)
    comment_counts = _to_day_counts(comment_rows)

    daily: list[DailyStatsOut] = []
    cumulative_members = base_members
    range_days = (end_date - start_date).days + 1
    for offset in range(range_days):
        current = start_date + timedelta(days=offset)
        cumulative_members += new_member_counts.get(current, 0)
        daily.append(
            DailyStatsOut(
                date=current,
                cumulative_members=cumulative_members,
                withdrawn_members=withdrawn_counts.get(current, 0),
                posts=post_counts.get(current, 0),
                comments=comment_counts.get(current, 0),
            )
        )

    summary = StatsSummary(
        total_members=int(await session.scalar(select(func.count(User.id))) or 0),
        active_members=int(
            await session.scalar(select(func.count(User.id)).where(User.is_active.is_(True))) or 0
        ),
        withdrawn_members=int(
            await session.scalar(select(func.count(User.id)).where(User.is_active.is_(False))) or 0
        ),
        total_posts=int(await session.scalar(select(func.count(Post.id))) or 0),
        total_comments=int(await session.scalar(select(func.count(Comment.id))) or 0),
    )

    board_rows = (
        await session.execute(
            select(
                Board.id,
                Board.slug,
                Board.name,
                func.count(Post.id).label('post_count'),
            )
            .outerjoin(Post, Post.board_id == Board.id)
            .group_by(Board.id, Board.slug, Board.name)
            .order_by(func.count(Post.id).desc(), Board.id.asc())
        )
    ).all()

    board_post_counts = [
        BoardPostCountOut(
            board_id=board_id,
            board_slug=board_slug,
            board_name=board_name,
            post_count=int(post_count),
        )
        for board_id, board_slug, board_name, post_count in board_rows
    ]

    return StatsMonitoringResponse(
        summary=summary,
        daily=daily,
        board_post_counts=board_post_counts,
    )
