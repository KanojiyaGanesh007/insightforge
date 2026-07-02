"""Services for dashboard layouts, widget CRUD, and pandas dynamic data aggregation."""

import os
from datetime import UTC, datetime
import numpy as np
import pandas as pd
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppException, NotFoundError
from app.models.dashboard import Dashboard, DashboardWidget
from app.models.dataset import Dataset, DatasetMetadata
from app.schemas.dashboard import WidgetCreate


class DashboardService:
    """Service handling dashboard sessions and widgets operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_dashboards(self, user_id: uuid.UUID) -> list[Dashboard]:
        """List active dashboards for a user."""
        query = (
            select(Dashboard)
            .where(Dashboard.user_id == user_id, Dashboard.deleted_at.is_(None))
            .order_by(Dashboard.updated_at.desc())
        )
        res = await self.db.execute(query)
        return list(res.scalars().all())

    async def get_dashboard(self, dashboard_id: uuid.UUID, user_id: uuid.UUID) -> Dashboard:
        """Fetch dashboard details with widgets."""
        query = select(Dashboard).where(
            Dashboard.id == dashboard_id,
            Dashboard.user_id == user_id,
            Dashboard.deleted_at.is_(None),
        )
        res = await self.db.execute(query)
        dashboard = res.scalar_one_or_none()
        if not dashboard:
            raise NotFoundError("Dashboard not found")
        return dashboard

    async def create_dashboard(
        self, user_id: uuid.UUID, name: str, description: str | None = None, is_auto_generated: bool = False
    ) -> Dashboard:
        """Create a new blank or auto dashboard layout."""
        dashboard = Dashboard(
            user_id=user_id,
            name=name,
            description=description,
            is_auto_generated=is_auto_generated,
        )
        self.db.add(dashboard)
        await self.db.commit()
        await self.db.refresh(dashboard)
        return dashboard

    async def update_dashboard(
        self, dashboard_id: uuid.UUID, user_id: uuid.UUID, name: str | None = None, description: str | None = None
    ) -> Dashboard:
        """Modify dashboard information properties."""
        dashboard = await self.get_dashboard(dashboard_id, user_id)
        if name is not None:
            dashboard.name = name
        if description is not None:
            dashboard.description = description
        self.db.add(dashboard)
        await self.db.commit()
        await self.db.refresh(dashboard)
        return dashboard

    async def delete_dashboard(self, dashboard_id: uuid.UUID, user_id: uuid.UUID) -> None:
        """Soft delete a dashboard and disable layout access."""
        dashboard = await self.get_dashboard(dashboard_id, user_id)
        dashboard.deleted_at = datetime.now(UTC)
        await self.db.commit()

    async def add_widget(
        self, dashboard_id: uuid.UUID, user_id: uuid.UUID, widget_data: WidgetCreate
    ) -> DashboardWidget:
        """Append a custom visualization widget inside a dashboard."""
        # 1. Verify dashboard ownership
        dashboard = await self.get_dashboard(dashboard_id, user_id)

        # 2. Verify dataset ownership
        dataset_query = select(Dataset).where(
            Dataset.id == widget_data.dataset_id,
            Dataset.user_id == user_id,
            Dataset.deleted_at.is_(None),
        )
        dataset_res = await self.db.execute(dataset_query)
        dataset = dataset_res.scalar_one_or_none()
        if not dataset:
            raise NotFoundError("Dataset not found or access denied")

        # 3. Create widget ORM
        widget = DashboardWidget(
            dashboard_id=dashboard_id,
            dataset_id=widget_data.dataset_id,
            title=widget_data.title,
            chart_type=widget_data.chart_type,
            x_axis=widget_data.x_axis,
            y_axis=widget_data.y_axis,
            aggregate_func=widget_data.aggregate_func,
            color_palette=widget_data.color_palette,
            layout_x=widget_data.layout_x,
            layout_y=widget_data.layout_y,
            layout_w=widget_data.layout_w,
            layout_h=widget_data.layout_h,
        )
        self.db.add(widget)
        await self.db.commit()
        await self.db.refresh(widget)
        
        # Refresh dashboard widgets relation cache
        await self.db.refresh(dashboard)
        return widget

    async def delete_widget(self, dashboard_id: uuid.UUID, widget_id: uuid.UUID, user_id: uuid.UUID) -> None:
        """Remove a widget layout config."""
        # Verify dashboard ownership
        await self.get_dashboard(dashboard_id, user_id)
        
        widget_query = select(DashboardWidget).where(
            DashboardWidget.id == widget_id, DashboardWidget.dashboard_id == dashboard_id
        )
        widget_res = await self.db.execute(widget_query)
        widget = widget_res.scalar_one_or_none()
        if not widget:
            raise NotFoundError("Widget not found")
            
        await self.db.delete(widget)
        await self.db.commit()


class WidgetDataService:
    """Service to load physical files and aggregate datasets dynamically using Pandas."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_widget_data(self, widget_id: uuid.UUID, user_id: uuid.UUID) -> list[dict[str, Any]]:
        """Query raw dataset files and run dynamic pandas aggregations."""
        # 1. Fetch widget and verify ownership
        widget_query = (
            select(DashboardWidget)
            .join(Dashboard)
            .where(
                DashboardWidget.id == widget_id,
                Dashboard.user_id == user_id,
                Dashboard.deleted_at.is_(None),
            )
        )
        res = await self.db.execute(widget_query)
        widget = res.scalar_one_or_none()
        if not widget:
            raise NotFoundError("Widget not found")

        # 2. Fetch dataset storage details
        dataset_query = select(Dataset).where(
            Dataset.id == widget.dataset_id, Dataset.deleted_at.is_(None)
        )
        dataset_res = await self.db.execute(dataset_query)
        dataset = dataset_res.scalar_one_or_none()
        if not dataset or not os.path.exists(dataset.storage_path):
            raise NotFoundError("Dataset physical file not found")

        # 3. Read dataset in Pandas
        ext = os.path.splitext(dataset.file_name)[1].lower()
        try:
            if ext == ".csv":
                df = pd.read_csv(dataset.storage_path)
            elif ext in [".xlsx", ".xls"]:
                df = pd.read_excel(dataset.storage_path)
            else:
                df = pd.read_json(dataset.storage_path)
        except Exception as e:
            raise AppException(f"Failed to read dataset: {str(e)}", code="INTERNAL_ERROR", status_code=500)

        # 4. Extract axes fields
        x_col = widget.x_axis
        y_col = widget.y_axis
        agg_func = widget.aggregate_func

        if x_col not in df.columns or y_col not in df.columns:
            raise AppException(
                f"Columns '{x_col}' or '{y_col}' do not exist in dataset schema",
                code="BAD_REQUEST",
                status_code=400,
            )

        # Clean null values in x_col
        df = df[[x_col, y_col]].dropna(subset=[x_col])

        # If performing math aggregation, convert y_col to numeric and drop NaN
        if agg_func and agg_func.lower() != "count":
            df[y_col] = pd.to_numeric(df[y_col], errors="coerce")
            df = df.dropna(subset=[y_col])

        # 5. Group and aggregate
        if agg_func:
            func = agg_func.lower()
            if func == "sum":
                grouped = df.groupby(x_col)[y_col].sum()
            elif func in ["avg", "mean"]:
                grouped = df.groupby(x_col)[y_col].mean()
            elif func == "count":
                grouped = df.groupby(x_col)[y_col].count()
            elif func == "min":
                grouped = df.groupby(x_col)[y_col].min()
            elif func == "max":
                grouped = df.groupby(x_col)[y_col].max()
            else:
                grouped = df.groupby(x_col)[y_col].sum()

            result = []
            for k, v in grouped.items():
                val = float(v) if not pd.isna(v) else 0.0
                # Use column names directly as keys (helps Recharts data-mapping)
                result.append({x_col: str(k), y_col: val})
        else:
            # Return raw row points (scatter plots, limits to 500 rows)
            df_sub = df.head(500).replace({np.nan: None})
            result = []
            for r in df_sub.to_dict(orient="records"):
                cleaned = {}
                for k, v in r.items():
                    if pd.isna(v) or v is None:
                        cleaned[k] = None
                    elif isinstance(v, (float, int)):
                        cleaned[k] = v
                    else:
                        cleaned[k] = str(v)
                result.append(cleaned)

        return result

    async def get_preview_data(
        self, dataset_id: uuid.UUID, x_axis: str, y_axis: str, aggregate_func: str | None, user_id: uuid.UUID
    ) -> list[dict[str, Any]]:
        """Query raw dataset files and run dynamic pandas groupings on the fly (before saving widget)."""
        # 1. Fetch dataset storage details
        dataset_query = select(Dataset).where(
            Dataset.id == dataset_id, Dataset.user_id == user_id, Dataset.deleted_at.is_(None)
        )
        dataset_res = await self.db.execute(dataset_query)
        dataset = dataset_res.scalar_one_or_none()
        if not dataset or not os.path.exists(dataset.storage_path):
            raise NotFoundError("Dataset physical file not found")

        # 2. Read dataset in Pandas
        ext = os.path.splitext(dataset.file_name)[1].lower()
        try:
            if ext == ".csv":
                df = pd.read_csv(dataset.storage_path)
            elif ext in [".xlsx", ".xls"]:
                df = pd.read_excel(dataset.storage_path)
            else:
                df = pd.read_json(dataset.storage_path)
        except Exception as e:
            raise AppException(f"Failed to read dataset: {str(e)}", code="INTERNAL_ERROR", status_code=500)

        # 3. Extract axes fields
        x_col = x_axis
        y_col = y_axis
        agg_func = aggregate_func

        if x_col not in df.columns or y_col not in df.columns:
            raise AppException(
                f"Columns '{x_col}' or '{y_col}' do not exist in dataset schema",
                code="BAD_REQUEST",
                status_code=400,
            )

        # Clean null values in x_col
        df = df[[x_col, y_col]].dropna(subset=[x_col])

        # If performing math aggregation, convert y_col to numeric and drop NaN
        if agg_func and agg_func.lower() != "count":
            df[y_col] = pd.to_numeric(df[y_col], errors="coerce")
            df = df.dropna(subset=[y_col])

        # 4. Group and aggregate
        if agg_func:
            func = agg_func.lower()
            if func == "sum":
                grouped = df.groupby(x_col)[y_col].sum()
            elif func in ["avg", "mean"]:
                grouped = df.groupby(x_col)[y_col].mean()
            elif func == "count":
                grouped = df.groupby(x_col)[y_col].count()
            elif func == "min":
                grouped = df.groupby(x_col)[y_col].min()
            elif func == "max":
                grouped = df.groupby(x_col)[y_col].max()
            else:
                grouped = df.groupby(x_col)[y_col].sum()

            result = []
            for k, v in grouped.items():
                val = float(v) if not pd.isna(v) else 0.0
                result.append({x_col: str(k), y_col: val})
        else:
            # Return raw row points (scatter plots, limits to 500 rows)
            df_sub = df.head(500).replace({np.nan: None})
            result = []
            for r in df_sub.to_dict(orient="records"):
                cleaned = {}
                for k, v in r.items():
                    if pd.isna(v) or v is None:
                        cleaned[k] = None
                    elif isinstance(v, (float, int)):
                        cleaned[k] = v
                    else:
                        cleaned[k] = str(v)
                result.append(cleaned)

        return result


class AutoDashboardService:
    """Service to auto-generate dashboards using dataset metadata heuristics."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def generate_auto_dashboard(self, dataset_id: uuid.UUID, user_id: uuid.UUID) -> Dashboard:
        """Construct a dashboard containing 3 automatic visualizations based on column logical types."""
        # 1. Fetch dataset and metadata
        query = select(Dataset).where(
            Dataset.id == dataset_id, Dataset.user_id == user_id, Dataset.deleted_at.is_(None)
        )
        res = await self.db.execute(query)
        dataset = res.scalar_one_or_none()
        if not dataset:
            raise NotFoundError("Dataset not found")

        meta_query = select(DatasetMetadata).where(DatasetMetadata.dataset_id == dataset_id)
        meta_res = await self.db.execute(meta_query)
        metadata = meta_res.scalar_one_or_none()
        if not metadata or not metadata.schema_json:
            raise AppException("Dataset schema metadata is missing", code="BAD_REQUEST", status_code=400)

        # 2. Extract column categories
        columns = metadata.schema_json.get("columns", [])
        date_cols = []
        numeric_cols = []
        categorical_cols = []
        geo_cols = []

        for col in columns:
            name = col.get("name", "")
            ctype = col.get("type", "categorical")
            if ctype == "date":
                date_cols.append(name)
            elif ctype == "numeric":
                numeric_cols.append(name)
            elif ctype == "geographic":
                geo_cols.append(name)
            else:
                categorical_cols.append(name)

        # Fallback if categories are dry
        all_col_names = [col.get("name", "") for col in columns]
        if not numeric_cols and len(all_col_names) > 0:
            # Fallback y-axis is first column name
            numeric_cols.append(all_col_names[0])

        if not categorical_cols:
            # Fallback x-axis is first column name
            categorical_cols.append(all_col_names[0])

        # 3. Create Dashboard
        dashboard = Dashboard(
            user_id=user_id,
            name=f"Auto-Dashboard: {dataset.name}",
            description=f"AI-generated analytics visualization dashboard for {dataset.name}.",
            is_auto_generated=True,
        )
        self.db.add(dashboard)
        await self.db.commit()
        await self.db.refresh(dashboard)

        widgets_to_add = []

        # Chart 1: Line Chart (Date vs Numeric)
        if date_cols and numeric_cols:
            widgets_to_add.append(
                DashboardWidget(
                    dashboard_id=dashboard.id,
                    dataset_id=dataset_id,
                    title=f"Avg {numeric_cols[0]} Over Time",
                    chart_type="line",
                    x_axis=date_cols[0],
                    y_axis=numeric_cols[0],
                    aggregate_func="avg",
                    layout_x=0,
                    layout_y=0,
                    layout_w=6,
                    layout_h=4,
                )
            )

        # Chart 2: Bar Chart (Categorical vs Numeric)
        if categorical_cols and numeric_cols:
            widgets_to_add.append(
                DashboardWidget(
                    dashboard_id=dashboard.id,
                    dataset_id=dataset_id,
                    title=f"Total {numeric_cols[0]} by {categorical_cols[0]}",
                    chart_type="bar",
                    x_axis=categorical_cols[0],
                    y_axis=numeric_cols[0],
                    aggregate_func="sum",
                    layout_x=6,
                    layout_y=0,
                    layout_w=6,
                    layout_h=4,
                )
            )

        # Chart 3: Pie Chart (Geographic or second Category distribution count)
        pie_x = geo_cols[0] if geo_cols else (categorical_cols[1] if len(categorical_cols) > 1 else categorical_cols[0])
        pie_y = numeric_cols[0]
        if pie_x and pie_y:
            widgets_to_add.append(
                DashboardWidget(
                    dashboard_id=dashboard.id,
                    dataset_id=dataset_id,
                    title=f"Record Distribution by {pie_x}",
                    chart_type="pie",
                    x_axis=pie_x,
                    y_axis=pie_y,
                    aggregate_func="count",
                    layout_x=0,
                    layout_y=4,
                    layout_w=12,
                    layout_h=4,
                )
            )

        # Add all widgets and commit
        for widget in widgets_to_add:
            self.db.add(widget)
        
        await self.db.commit()
        await self.db.refresh(dashboard)
        
        return dashboard
