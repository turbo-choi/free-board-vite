from pathlib import Path

from fastapi import APIRouter, File, UploadFile, status
from fastapi.responses import FileResponse

from app.core.deps import CurrentUserDep, SessionDep
from app.core.exceptions import AppException
from app.crud.attachment import get_attachment_by_id
from app.crud.post import get_post_by_id
from app.models.attachment import Attachment
from app.schemas.attachment import AttachmentOut
from app.services.access_control import ensure_read_permission, ensure_write_permission
from app.services.file_storage import delete_file_if_exists, get_absolute_path, save_upload_file

router = APIRouter(tags=['attachments'])


@router.post('/posts/{post_id}/attachments', response_model=AttachmentOut, status_code=status.HTTP_201_CREATED)
async def upload_attachment(
    post_id: int,
    user: CurrentUserDep,
    session: SessionDep,
    file: UploadFile = File(...),
) -> AttachmentOut:
    post = await get_post_by_id(session, post_id)
    if post is None:
        raise AppException('Post not found', 'POST_NOT_FOUND', 404)

    if not post.board.settings_json.get('allowAttachment', True):
        raise AppException('Attachment is disabled for this board', 'ATTACHMENT_DISABLED', 400)
    await ensure_write_permission(session, target=f'/boards/{post.board.slug}', role=user.role)

    relative_path, size, mime_type = save_upload_file(post_id, file)
    attachment = Attachment(
        post_id=post_id,
        file_name=file.filename or 'file',
        mime_type=mime_type,
        size=size,
        storage_path=relative_path,
    )
    session.add(attachment)
    await session.commit()
    await session.refresh(attachment)

    return AttachmentOut.model_validate(attachment)


@router.get('/attachments/{attachment_id}/download')
async def download_attachment(
    attachment_id: int,
    user: CurrentUserDep,
    session: SessionDep,
) -> FileResponse:
    attachment = await get_attachment_by_id(session, attachment_id)
    if attachment is None:
        raise AppException('Attachment not found', 'ATTACHMENT_NOT_FOUND', 404)

    absolute_path: Path = get_absolute_path(attachment.storage_path)
    if not absolute_path.exists():
        raise AppException('Stored file not found', 'FILE_NOT_FOUND', 404)

    await ensure_read_permission(session, target=f'/boards/{attachment.post.board.slug}', role=user.role)

    return FileResponse(
        path=str(absolute_path),
        media_type='application/octet-stream',
        filename=attachment.file_name,
        content_disposition_type='attachment',
        headers={'X-Content-Type-Options': 'nosniff'},
    )


@router.delete('/attachments/{attachment_id}', status_code=status.HTTP_204_NO_CONTENT)
async def delete_attachment(
    attachment_id: int,
    user: CurrentUserDep,
    session: SessionDep,
) -> None:
    attachment = await get_attachment_by_id(session, attachment_id)
    if attachment is None:
        raise AppException('Attachment not found', 'ATTACHMENT_NOT_FOUND', 404)

    await ensure_write_permission(session, target=f'/boards/{attachment.post.board.slug}', role=user.role)

    can_manage = attachment.post.author_id == user.id or user.role.value == 'ADMIN'
    if not can_manage:
        raise AppException('No permission', 'FORBIDDEN', 403)

    delete_file_if_exists(attachment.storage_path)
    await session.delete(attachment)
    await session.commit()
