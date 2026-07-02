"""Dataset repositories."""

from uuid import UUID
from sqlalchemy import select, and_
from app.models.dataset import Dataset, DatasetMetadata
from app.repositories.base import BaseRepository


class DatasetRepository(BaseRepository[Dataset]):
    model = Dataset

    async def list_by_user(self, user_id: UUID, skip: int = 0, limit: int = 100) -> list[Dataset]:
        result = await self.session.execute(
            select(self.model)
            .where(
                and_(
                    self.model.user_id == user_id,
                    self.model.deleted_at == None,
                )
            )
            .order_by(self.model.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_by_id_and_user(self, dataset_id: UUID, user_id: UUID) -> Dataset | None:
        result = await self.session.execute(
            select(self.model).where(
                and_(
                    self.model.id == dataset_id,
                    self.model.user_id == user_id,
                    self.model.deleted_at == None,
                )
            )
        )
        return result.scalar_one_or_none()


class DatasetMetadataRepository(BaseRepository[DatasetMetadata]):
    model = DatasetMetadata

    async def get_by_dataset_id(self, dataset_id: UUID) -> DatasetMetadata | None:
        result = await self.session.execute(
            select(self.model).where(self.model.dataset_id == dataset_id)
        )
        return result.scalar_one_or_none()
