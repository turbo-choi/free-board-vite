from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.board import Board


async def list_boards(session: AsyncSession) -> list[Board]:
    result = await session.scalars(select(Board).order_by(Board.id.asc()))
    return list(result)


async def get_board_by_id(session: AsyncSession, board_id: int) -> Board | None:
    return await session.scalar(select(Board).where(Board.id == board_id))


async def get_board_by_slug(session: AsyncSession, slug: str) -> Board | None:
    return await session.scalar(select(Board).where(Board.slug == slug))


async def create_board(session: AsyncSession, board: Board) -> Board:
    session.add(board)
    await session.commit()
    await session.refresh(board)
    return board


async def delete_board(session: AsyncSession, board: Board) -> None:
    await session.delete(board)
    await session.commit()
