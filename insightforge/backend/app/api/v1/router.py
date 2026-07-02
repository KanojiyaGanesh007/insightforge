"""API v1 route aggregation."""

from fastapi import APIRouter

from app.api.v1.endpoints import health
from app.auth.router import router as auth_router
from app.datasets.router import router as datasets_router
from app.analytics.router import router as analytics_router
from app.dashboards.router import router as dashboards_router

api_v1_router = APIRouter()

api_v1_router.include_router(health.router, tags=["health"])
api_v1_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_v1_router.include_router(datasets_router, prefix="/datasets", tags=["datasets"])
api_v1_router.include_router(analytics_router, tags=["analytics"])
api_v1_router.include_router(dashboards_router, prefix="/dashboards", tags=["dashboards"])

