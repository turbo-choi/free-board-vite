from datetime import datetime

from pydantic import BaseModel


class AttachmentOut(BaseModel):
    id: int
    post_id: int
    file_name: str
    mime_type: str
    size: int
    storage_path: str
    created_at: datetime

    model_config = {'from_attributes': True}
