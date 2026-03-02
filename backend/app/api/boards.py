from fastapi import APIRouter, status
from sqlalchemy import select

from app.core.deps import CurrentUserDep, SessionDep
from app.core.exceptions import AppException
from app.crud.board import create_board, delete_board, get_board_by_id, list_boards
from app.models.board import Board
from app.schemas.board import BoardCreateRequest, BoardListResponse, BoardOut, BoardUpdateRequest
from app.services.access_control import ensure_write_permission, has_read_permission

router = APIRouter(prefix='/boards', tags=['boards'])


@router.get('', response_model=BoardListResponse)
async def get_boards(user: CurrentUserDep, session: SessionDep) -> BoardListResponse:
    boards = await list_boards(session)
    if await has_read_permission(session, target='/admin/boards', role=user.role):
        return BoardListResponse(items=[BoardOut.model_validate(board) for board in boards])

    visible_boards = []
    for board in boards:
        if await has_read_permission(session, target=f'/boards/{board.slug}', role=user.role):
            visible_boards.append(board)
    return BoardListResponse(items=[BoardOut.model_validate(board) for board in visible_boards])


@router.post('', response_model=BoardOut, status_code=status.HTTP_201_CREATED)
async def create_board_endpoint(
    payload: BoardCreateRequest,
    user: CurrentUserDep,
    session: SessionDep,
) -> BoardOut:
    await ensure_write_permission(session, target='/admin/boards', role=user.role)
    exists = await session.scalar(select(Board).where(Board.slug == payload.slug))
    if exists:
        raise AppException('Board slug already exists', 'BOARD_SLUG_EXISTS', 409)

    board = Board(**payload.model_dump())
    board = await create_board(session, board)
    return BoardOut.model_validate(board)


@router.patch('/{board_id}', response_model=BoardOut)
async def update_board_endpoint(
    board_id: int,
    payload: BoardUpdateRequest,
    user: CurrentUserDep,
    session: SessionDep,
) -> BoardOut:
    await ensure_write_permission(session, target='/admin/boards', role=user.role)
    board = await get_board_by_id(session, board_id)
    if board is None:
        raise AppException('Board not found', 'BOARD_NOT_FOUND', 404)

    updates = payload.model_dump(exclude_unset=True)
    if 'slug' in updates and updates['slug'] != board.slug:
        exists = await session.scalar(select(Board).where(Board.slug == updates['slug']))
        if exists:
            raise AppException('Board slug already exists', 'BOARD_SLUG_EXISTS', 409)

    for key, value in updates.items():
        setattr(board, key, value)

    await session.commit()
    await session.refresh(board)
    return BoardOut.model_validate(board)


@router.delete('/{board_id}', status_code=status.HTTP_204_NO_CONTENT)
async def delete_board_endpoint(board_id: int, user: CurrentUserDep, session: SessionDep) -> None:
    await ensure_write_permission(session, target='/admin/boards', role=user.role)
    board = await get_board_by_id(session, board_id)
    if board is None:
        raise AppException('Board not found', 'BOARD_NOT_FOUND', 404)

    await delete_board(session, board)
