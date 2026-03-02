import os
import shutil
from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile

from app.core.config import settings
from app.core.exceptions import AppException



def ensure_upload_dir() -> Path:
    upload_root = Path(settings.upload_dir)
    upload_root.mkdir(parents=True, exist_ok=True)
    return upload_root



def _safe_file_name(file_name: str) -> str:
    return ''.join(ch if ch.isalnum() or ch in {'.', '-', '_'} else '_' for ch in file_name)



def save_upload_file(post_id: int, file: UploadFile) -> tuple[str, int, str]:
    upload_root = ensure_upload_dir()
    post_dir = upload_root / str(post_id)
    post_dir.mkdir(parents=True, exist_ok=True)

    safe_name = _safe_file_name(file.filename or 'file')
    stored_name = f'{uuid4().hex}_{safe_name}'
    path = post_dir / stored_name

    size = 0
    max_upload_bytes = int(settings.max_upload_size_mb) * 1024 * 1024
    try:
        with path.open('wb') as target:
            while chunk := file.file.read(1024 * 1024):
                next_size = size + len(chunk)
                if next_size > max_upload_bytes:
                    raise AppException(
                        f'Attachment exceeds max size ({settings.max_upload_size_mb}MB).',
                        'FILE_TOO_LARGE',
                        413,
                    )
                size = next_size
                target.write(chunk)
    except Exception:
        path.unlink(missing_ok=True)
        raise

    mime_type = file.content_type or 'application/octet-stream'
    relative_path = os.path.relpath(path, start=upload_root)
    return relative_path, size, mime_type



def get_absolute_path(storage_path: str) -> Path:
    upload_root = ensure_upload_dir().resolve()
    resolved = (upload_root / storage_path).resolve()
    try:
        resolved.relative_to(upload_root)
    except ValueError:
        raise AppException('Invalid storage path', 'INVALID_STORAGE_PATH', 400)
    return resolved



def delete_file_if_exists(storage_path: str) -> None:
    absolute_path = get_absolute_path(storage_path)
    if absolute_path.exists():
        absolute_path.unlink(missing_ok=True)



def clear_post_dir_if_empty(post_id: int) -> None:
    upload_root = ensure_upload_dir()
    post_dir = upload_root / str(post_id)
    if post_dir.exists() and not any(post_dir.iterdir()):
        shutil.rmtree(post_dir, ignore_errors=True)
