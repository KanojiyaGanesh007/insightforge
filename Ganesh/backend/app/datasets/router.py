"""Dataset API endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends, Form, File, UploadFile, status
from starlette.responses import Response

from app.entities.user import UserEntity
from app.api.deps import get_dataset_service, require_permission
from app.datasets.service import DatasetService
from app.mappers.dataset_mapper import DatasetMapper
from app.schemas.dataset import (
    DatasetDetailsResponse,
    DatasetPreviewResponse,
    DatasetResponse,
)

router = APIRouter()


@router.post(
    "/upload",
    response_model=DatasetResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission("datasets:write"))],
)
async def upload_dataset(
    file: UploadFile = File(...),
    name: str | None = Form(None),
    current_user: UserEntity = Depends(require_permission("datasets:write")),
    service: DatasetService = Depends(get_dataset_service),
) -> DatasetResponse:
    entity = await service.upload(file, current_user.id, name)
    return DatasetMapper.entity_to_response(entity)


@router.get(
    "",
    response_model=list[DatasetResponse],
    dependencies=[Depends(require_permission("datasets:read"))],
)
async def list_datasets(
    current_user: UserEntity = Depends(require_permission("datasets:read")),
    service: DatasetService = Depends(get_dataset_service),
    skip: int = 0,
    limit: int = 100,
) -> list[DatasetResponse]:
    entities = await service.list_datasets(current_user.id, skip=skip, limit=limit)
    return [DatasetMapper.entity_to_response(e) for e in entities]


@router.get(
    "/{id}",
    response_model=DatasetDetailsResponse,
    dependencies=[Depends(require_permission("datasets:read"))],
)
async def get_dataset(
    id: UUID,
    current_user: UserEntity = Depends(require_permission("datasets:read")),
    service: DatasetService = Depends(get_dataset_service),
) -> DatasetDetailsResponse:
    entity = await service.get_dataset(id, current_user.id)
    return DatasetMapper.entity_to_details_response(entity)


@router.delete(
    "/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_permission("datasets:delete"))],
)
async def delete_dataset(
    id: UUID,
    current_user: UserEntity = Depends(require_permission("datasets:delete")),
    service: DatasetService = Depends(get_dataset_service),
) -> Response:
    await service.delete_dataset(id, current_user.id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get(
    "/{id}/preview",
    response_model=DatasetPreviewResponse,
    dependencies=[Depends(require_permission("datasets:read"))],
)
async def get_dataset_preview(
    id: UUID,
    current_user: UserEntity = Depends(require_permission("datasets:read")),
    service: DatasetService = Depends(get_dataset_service),
    limit: int = 20,
) -> DatasetPreviewResponse:
    preview = await service.get_preview(id, current_user.id, limit=limit)
    return DatasetPreviewResponse(columns=preview["columns"], rows=preview["rows"])


@router.get(
    "/{id}/quality",
    response_model=dict,
    dependencies=[Depends(require_permission("datasets:read"))],
)
async def get_dataset_quality(
    id: UUID,
    current_user: UserEntity = Depends(require_permission("datasets:read")),
    service: DatasetService = Depends(get_dataset_service),
) -> dict:
    entity = await service.get_dataset(id, current_user.id)
    if not entity.metadata or not entity.metadata.profile_json:
        return {"overall": {}, "columns": {}, "issues": []}
    return entity.metadata.profile_json.get("quality", {"overall": {}, "columns": {}, "issues": []})


@router.get(
    "/{id}/intelligence",
    response_model=dict,
    dependencies=[Depends(require_permission("datasets:read"))],
)
async def get_dataset_intelligence(
    id: UUID,
    current_user: UserEntity = Depends(require_permission("datasets:read")),
    service: DatasetService = Depends(get_dataset_service),
) -> dict:
    entity = await service.get_dataset(id, current_user.id)
    if not entity.metadata:
        return {"columns": [], "dataset_type": "undetermined", "confidence_score": 0.0}
    return {
        "columns": entity.metadata.schema_json.get("columns", []) if entity.metadata.schema_json else [],
        "dataset_type": entity.metadata.dataset_type,
        "confidence_score": entity.metadata.confidence_score,
    }

