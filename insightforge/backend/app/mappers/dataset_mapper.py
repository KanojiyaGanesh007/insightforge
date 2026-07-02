"""Dataset object mappers."""

from app.entities.dataset import DatasetEntity, DatasetMetadataEntity
from app.models.dataset import Dataset, DatasetMetadata
from app.schemas.dataset import DatasetDetailsResponse, DatasetMetadataResponse, DatasetResponse


class DatasetMapper:
    @staticmethod
    def metadata_model_to_entity(model: DatasetMetadata) -> DatasetMetadataEntity:
        return DatasetMetadataEntity(
            id=model.id,
            dataset_id=model.dataset_id,
            schema_json=model.schema_json,
            profile_json=model.profile_json,
            dataset_type=model.dataset_type,
            confidence_score=model.confidence_score,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )

    @staticmethod
    def model_to_entity(model: Dataset) -> DatasetEntity:
        meta_entity = None
        if model.metadata_rel:
            meta_entity = DatasetMapper.metadata_model_to_entity(model.metadata_rel)

        return DatasetEntity(
            id=model.id,
            user_id=model.user_id,
            organization_id=model.organization_id,
            name=model.name,
            file_name=model.file_name,
            file_format=model.file_format,
            file_size_bytes=model.file_size_bytes,
            storage_path=model.storage_path,
            status=model.status,
            created_at=model.created_at,
            updated_at=model.updated_at,
            metadata=meta_entity,
        )

    @staticmethod
    def entity_to_response(entity: DatasetEntity) -> DatasetResponse:
        return DatasetResponse(
            id=entity.id,
            name=entity.name,
            file_name=entity.file_name,
            file_format=entity.file_format,
            file_size_bytes=entity.file_size_bytes,
            status=entity.status,
            created_at=entity.created_at,
            updated_at=entity.updated_at,
        )

    @staticmethod
    def entity_to_details_response(entity: DatasetEntity) -> DatasetDetailsResponse:
        meta_resp = None
        if entity.metadata:
            meta_resp = DatasetMetadataResponse(
                schema_json=entity.metadata.schema_json,
                profile_json=entity.metadata.profile_json,
                dataset_type=entity.metadata.dataset_type,
                confidence_score=entity.metadata.confidence_score,
            )

        return DatasetDetailsResponse(
            id=entity.id,
            name=entity.name,
            file_name=entity.file_name,
            file_format=entity.file_format,
            file_size_bytes=entity.file_size_bytes,
            status=entity.status,
            created_at=entity.created_at,
            updated_at=entity.updated_at,
            metadata=meta_resp,
        )
