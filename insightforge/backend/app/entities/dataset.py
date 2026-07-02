"""Dataset domain entities."""

import uuid
from datetime import datetime
from pydantic import BaseModel


class DatasetMetadataEntity(BaseModel):
    id: uuid.UUID
    dataset_id: uuid.UUID
    schema_json: dict | None = None
    profile_json: dict | None = None
    dataset_type: str | None = None
    confidence_score: float | None = None
    created_at: datetime
    updated_at: datetime


class DatasetEntity(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    organization_id: uuid.UUID | None = None
    name: str
    file_name: str
    file_format: str
    file_size_bytes: int
    storage_path: str
    status: str
    created_at: datetime
    updated_at: datetime
    metadata: DatasetMetadataEntity | None = None
