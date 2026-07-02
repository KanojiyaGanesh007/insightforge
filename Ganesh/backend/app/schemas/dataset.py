"""Dataset API schemas."""

import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class DatasetMetadataResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    schema_json: dict | None = None
    profile_json: dict | None = None
    dataset_type: str | None = None
    confidence_score: float | None = None


class DatasetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    file_name: str
    file_format: str
    file_size_bytes: int
    status: str
    created_at: datetime
    updated_at: datetime



class DatasetDetailsResponse(DatasetResponse):
    metadata: DatasetMetadataResponse | None = None


class DatasetPreviewResponse(BaseModel):
    columns: list[str]
    rows: list[dict]
