"""API routes for dashboards management, widget configurations, and aggregated data endpoints."""

from uuid import UUID
from fastapi import APIRouter, Depends, status
from starlette.responses import Response

from app.api.deps import DbSession, require_permission
from app.dashboards.service import AutoDashboardService, DashboardService, WidgetDataService
from app.entities.user import UserEntity
from app.schemas.dashboard import (
    DashboardCreate,
    DashboardResponse,
    DashboardUpdate,
    WidgetCreate,
    WidgetDataResponse,
    WidgetResponse,
)

router = APIRouter()


async def get_dashboard_service(db: DbSession) -> DashboardService:
    """Dependency: retrieve initialized DashboardService."""
    return DashboardService(db)


async def get_widget_data_service(db: DbSession) -> WidgetDataService:
    """Dependency: retrieve initialized WidgetDataService."""
    return WidgetDataService(db)


async def get_auto_dashboard_service(db: DbSession) -> AutoDashboardService:
    """Dependency: retrieve initialized AutoDashboardService."""
    return AutoDashboardService(db)


# 1. Dashboards CRUD
@router.get(
    "",
    response_model=list[DashboardResponse],
    dependencies=[Depends(require_permission("dashboards:read"))],
)
async def list_dashboards(
    current_user: UserEntity = Depends(require_permission("dashboards:read")),
    service: DashboardService = Depends(get_dashboard_service),
) -> list[DashboardResponse]:
    """List all active user dashboards."""
    dashboards = await service.list_dashboards(current_user.id)
    return [DashboardResponse.model_validate(d) for d in dashboards]


@router.post(
    "",
    response_model=DashboardResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission("dashboards:write"))],
)
async def create_dashboard(
    body: DashboardCreate,
    current_user: UserEntity = Depends(require_permission("dashboards:write")),
    service: DashboardService = Depends(get_dashboard_service),
) -> DashboardResponse:
    """Create a new manual dashboard session."""
    dashboard = await service.create_dashboard(current_user.id, body.name, body.description)
    return DashboardResponse.model_validate(dashboard)


@router.get(
    "/{id}",
    response_model=DashboardResponse,
    dependencies=[Depends(require_permission("dashboards:read"))],
)
async def get_dashboard(
    id: UUID,
    current_user: UserEntity = Depends(require_permission("dashboards:read")),
    service: DashboardService = Depends(get_dashboard_service),
) -> DashboardResponse:
    """Retrieve details and widgets of a specific dashboard."""
    dashboard = await service.get_dashboard(id, current_user.id)
    return DashboardResponse.model_validate(dashboard)


@router.patch(
    "/{id}",
    response_model=DashboardResponse,
    dependencies=[Depends(require_permission("dashboards:write"))],
)
async def update_dashboard(
    id: UUID,
    body: DashboardUpdate,
    current_user: UserEntity = Depends(require_permission("dashboards:write")),
    service: DashboardService = Depends(get_dashboard_service),
) -> DashboardResponse:
    """Update dashboard properties (name, description)."""
    dashboard = await service.update_dashboard(id, current_user.id, body.name, body.description)
    return DashboardResponse.model_validate(dashboard)


@router.delete(
    "/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_permission("dashboards:write"))],
)
async def delete_dashboard(
    id: UUID,
    current_user: UserEntity = Depends(require_permission("dashboards:write")),
    service: DashboardService = Depends(get_dashboard_service),
) -> Response:
    """Soft delete a dashboard and disable layout access."""
    await service.delete_dashboard(id, current_user.id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# 2. Widgets Management
@router.post(
    "/{id}/widgets",
    response_model=WidgetResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission("dashboards:write"))],
)
async def add_widget(
    id: UUID,
    body: WidgetCreate,
    current_user: UserEntity = Depends(require_permission("dashboards:write")),
    service: DashboardService = Depends(get_dashboard_service),
) -> WidgetResponse:
    """Add a new visualization widget inside an existing dashboard."""
    widget = await service.add_widget(id, current_user.id, body)
    return WidgetResponse.model_validate(widget)


@router.delete(
    "/{id}/widgets/{widget_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_permission("dashboards:write"))],
)
async def delete_widget(
    id: UUID,
    widget_id: UUID,
    current_user: UserEntity = Depends(require_permission("dashboards:write")),
    service: DashboardService = Depends(get_dashboard_service),
) -> Response:
    """Remove a widget configuration from a dashboard."""
    await service.delete_widget(id, widget_id, current_user.id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# 3. Dynamic Aggregated Data Endpoint
@router.get(
    "/widgets/{widget_id}/data",
    response_model=WidgetDataResponse,
    dependencies=[Depends(require_permission("dashboards:read"))],
)
async def get_widget_data(
    widget_id: UUID,
    current_user: UserEntity = Depends(require_permission("dashboards:read")),
    service: WidgetDataService = Depends(get_widget_data_service),
) -> WidgetDataResponse:
    """Read stored file and run dynamic pandas groupings on the fly."""
    aggregated = await service.get_widget_data(widget_id, current_user.id)
    return WidgetDataResponse(widget_id=widget_id, data=aggregated)


# 3.5 Preview Dataset Aggregations
@router.get(
    "/preview-data",
    dependencies=[Depends(require_permission("dashboards:read"))],
)
async def get_preview_data(
    dataset_id: UUID,
    x_axis: str,
    y_axis: str,
    aggregate_func: str | None = None,
    current_user: UserEntity = Depends(require_permission("dashboards:read")),
    service: WidgetDataService = Depends(get_widget_data_service),
):
    """Aggregate a dataset dynamically before creating a dashboard widget."""
    aggregated = await service.get_preview_data(dataset_id, x_axis, y_axis, aggregate_func, current_user.id)
    return {"data": aggregated}


# 4. Auto-Dashboard Generator
@router.post(
    "/auto-generate/{dataset_id}",
    response_model=DashboardResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission("dashboards:write"))],
)
async def auto_generate_dashboard(
    dataset_id: UUID,
    current_user: UserEntity = Depends(require_permission("dashboards:write")),
    service: AutoDashboardService = Depends(get_auto_dashboard_service),
) -> DashboardResponse:
    """Generate recommended dashboard layout widgets matching dataset schemas."""
    dashboard = await service.generate_auto_dashboard(dataset_id, current_user.id)
    return DashboardResponse.model_validate(dashboard)
