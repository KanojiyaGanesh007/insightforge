"""Dataset management and analysis service."""

import os
from datetime import UTC, datetime
from uuid import UUID, uuid4
import numpy as np
import pandas as pd
from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import AppException, NotFoundError
from app.entities.dataset import DatasetEntity
from app.mappers.dataset_mapper import DatasetMapper
from app.models.dataset import Dataset, DatasetMetadata
from app.repositories.dataset_repository import DatasetRepository


class DatasetService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.dataset_repo = DatasetRepository(session)

    async def upload(self, file: UploadFile, user_id: UUID, name: str | None = None) -> DatasetEntity:
        # 1. Validate File extension
        filename = file.filename or ""
        ext = os.path.splitext(filename)[1].lower()
        if ext not in [".csv", ".xlsx", ".xls", ".json"]:
            raise AppException(
                "Invalid file format. Supported formats: CSV, Excel, JSON.",
                code="BAD_REQUEST",
                status_code=400,
            )

        # 2. Check upload directory
        upload_dir = os.path.abspath(settings.UPLOAD_DIR)
        os.makedirs(upload_dir, exist_ok=True)

        dataset_id = uuid4()
        storage_filename = f"{dataset_id}{ext}"
        storage_path = os.path.join(upload_dir, storage_filename)

        # 3. Read and save file content
        file_content = await file.read()
        file_size = len(file_content)

        # File size validation (50MB limit)
        max_size = 50 * 1024 * 1024
        if file_size > max_size:
            raise AppException(
                "File size exceeds the 50 MB limit.",
                code="BAD_REQUEST",
                status_code=400,
            )

        # Write to disk
        try:
            with open(storage_path, "wb") as f:
                f.write(file_content)
        except Exception as e:
            raise AppException(
                f"Failed to save file to storage: {str(e)}",
                code="INTERNAL_ERROR",
                status_code=500,
            )

        # Reset read pointer just in case
        await file.seek(0)

        # 4. Parse file to validate and extract schema
        try:
            if ext == ".csv":
                # Seek start of bytes for pandas read
                from io import BytesIO
                df = pd.read_csv(BytesIO(file_content))
            elif ext in [".xlsx", ".xls"]:
                from io import BytesIO
                df = pd.read_excel(BytesIO(file_content))
            else:  # .json
                from io import BytesIO
                df = pd.read_json(BytesIO(file_content))
        except Exception as e:
            # Clean up the file if parsing fails
            if os.path.exists(storage_path):
                os.remove(storage_path)
            raise AppException(
                f"Failed to parse and read dataset: {str(e)}",
                code="BAD_REQUEST",
                status_code=400,
            )

        # 5. Run Intelligence & Data Quality Engines
        from app.datasets.intelligence import detect_column_type, profile_column, classify_dataset_domain
        from app.datasets.quality import calculate_data_quality

        columns_schema = []
        for col in df.columns:
            col_name = str(col)
            logical_type = detect_column_type(df[col], col_name)
            col_profile = profile_column(df[col], logical_type)
            columns_schema.append({
                "name": col_name,
                "type": logical_type,
                "profile": col_profile,
            })

        row_count = len(df)
        col_count = len(df.columns)

        schema_json = {
            "columns": columns_schema,
            "row_count": row_count,
            "column_count": col_count,
        }

        # Domain classification
        dataset_type, confidence = classify_dataset_domain(list(df.columns))

        # Data quality profiling
        quality_report = calculate_data_quality(df, columns_schema)

        profile_json = {
            "quality": quality_report,
            "summary": {
                "rows": row_count,
                "columns": col_count,
            }
        }

        # 6. Save records
        db_name = name or os.path.splitext(filename)[0]
        dataset = Dataset(
            id=dataset_id,
            user_id=user_id,
            name=db_name,
            file_name=filename,
            file_format=ext[1:],
            file_size_bytes=file_size,
            storage_path=storage_path,
            status="active",
        )

        metadata = DatasetMetadata(
            dataset_id=dataset_id,
            schema_json=schema_json,
            profile_json=profile_json,
            dataset_type=dataset_type,
            confidence_score=confidence,
        )
        dataset.metadata_rel = metadata

        await self.dataset_repo.add(dataset)
        await self.session.commit()

        # Reload entity with relationship
        return DatasetMapper.model_to_entity(dataset)

    async def list_datasets(self, user_id: UUID, skip: int = 0, limit: int = 100) -> list[DatasetEntity]:
        models = await self.dataset_repo.list_by_user(user_id, skip=skip, limit=limit)
        return [DatasetMapper.model_to_entity(m) for m in models]

    async def get_dataset(self, dataset_id: UUID, user_id: UUID) -> DatasetEntity:
        dataset = await self.dataset_repo.get_by_id_and_user(dataset_id, user_id)
        if not dataset:
            raise NotFoundError("Dataset not found")
        return DatasetMapper.model_to_entity(dataset)

    async def delete_dataset(self, dataset_id: UUID, user_id: UUID) -> None:
        dataset = await self.dataset_repo.get_by_id_and_user(dataset_id, user_id)
        if not dataset:
            raise NotFoundError("Dataset not found")

        # Soft delete in db
        dataset.deleted_at = datetime.now(UTC)

        # Delete physical file from disk
        if os.path.exists(dataset.storage_path):
            try:
                os.remove(dataset.storage_path)
            except Exception:
                # Log warning but don't fail transaction
                pass

        await self.session.commit()

    async def get_preview(self, dataset_id: UUID, user_id: UUID, limit: int = 20) -> dict:
        dataset = await self.dataset_repo.get_by_id_and_user(dataset_id, user_id)
        if not dataset:
            raise NotFoundError("Dataset not found")

        if not os.path.exists(dataset.storage_path):
            raise NotFoundError("Stored dataset file could not be found on disk")

        # Load file and fetch preview
        ext = f".{dataset.file_format}"
        try:
            if ext == ".csv":
                df = pd.read_csv(dataset.storage_path, nrows=limit)
            elif ext in [".xlsx", ".xls"]:
                df = pd.read_excel(dataset.storage_path, nrows=limit)
            else:  # .json
                df = pd.read_json(dataset.storage_path)
                df = df.head(limit)
        except Exception as e:
            raise AppException(
                f"Failed to parse dataset preview: {str(e)}",
                code="BAD_REQUEST",
                status_code=400,
            )

        # Clean preview for JSON compliance (handle NaN, Infinity, dates)
        df_preview = df.replace({np.nan: None})
        records = []
        for r in df_preview.to_dict(orient="records"):
            cleaned = {}
            for k, v in r.items():
                if pd.isna(v) or v is None:
                    cleaned[str(k)] = None
                elif isinstance(v, (datetime, pd.Timestamp)):
                    cleaned[str(k)] = v.isoformat()
                elif isinstance(v, float) and (np.isinf(v) or np.isnan(v)):
                    cleaned[str(k)] = None
                else:
                    cleaned[str(k)] = v
            records.append(cleaned)

        columns = [str(col) for col in df.columns]
        return {"columns": columns, "rows": records}
