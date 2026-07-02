"""Pydantic schemas for dashboards and widgets."""

from datetime import datetime
from typing import Any
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict


class WidgetCreate(BaseModel):
    dataset_id: UUID
    title: str = Field(..., max_length=255)
    chart_type: str = Field(..., max_length=50)
    x_axis: str = Field(..., max_length=100)
    y_axis: str = Field(..., max_length=100)
    aggregate_func: str | None = Field(default=None, max_length=50)
    color_palette: str | None = Field(default=None, max_length=50)
    layout_x: int = Field(default=0)
    layout_y: int = Field(default=0)
    layout_w: int = Field(default=6)
    layout_h: int = Field(default=4)


class WidgetUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=255)
    chart_type: str | None = Field(default=None, max_length=50)
    x_axis: str | None = Field(default=None, max_length=100)
    y_axis: str | None = Field(default=None, max_length=100)
    aggregate_func: str | None = Field(default=None, max_length=50)
    color_palette: str | None = Field(default=None, max_length=50)
    layout_x: int | None = Field(default=None)
    layout_y: int | None = Field(default=None)
    layout_w: int | None = Field(default=None)
    layout_h: int | None = Field(default=None)


class WidgetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    dashboard_id: UUID
    dataset_id: UUID
    title: str
    chart_type: str
    x_axis: str
    y_axis: str
    aggregate_func: str | None
    color_palette: str | None
    layout_x: int
    layout_y: int
    layout_w: int
    layout_h: int
    created_at: datetime
    updated_at: datetime


class DashboardCreate(BaseModel):
    name: str = Field(..., max_length=255)
    description: str | None = Field(default=None, max_length=512)


class DashboardUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=255)
    description: str | None = Field(default=None, max_length=512)


class DashboardResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    name: str
    description: str | None
    is_auto_generated: bool
    created_at: datetime
    updated_at: datetime
    widgets: list[WidgetResponse] = Field(default_factory=list)


class WidgetDataResponse(BaseModel):
    widget_id: UUID
    data: list[dict[str, Any]] = Field(default_factory=list)
