from datetime import date

from pydantic import BaseModel


class StatsSummary(BaseModel):
    total_members: int
    active_members: int
    withdrawn_members: int
    total_posts: int
    total_comments: int


class DailyStatsOut(BaseModel):
    date: date
    cumulative_members: int
    withdrawn_members: int
    posts: int
    comments: int


class BoardPostCountOut(BaseModel):
    board_id: int
    board_slug: str
    board_name: str
    post_count: int


class StatsMonitoringResponse(BaseModel):
    summary: StatsSummary
    daily: list[DailyStatsOut]
    board_post_counts: list[BoardPostCountOut]
