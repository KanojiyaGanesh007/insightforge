"""Shared API schemas."""

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str
    app: str
    version: str
    environment: str


class ReadyResponse(BaseModel):
    status: str
    checks: dict[str, str]


class ErrorResponse(BaseModel):
    error: dict[str, str]


class PaginationParams(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)


class PaginatedResponse(BaseModel):
    items: list
    total: int
    page: int
    page_size: int
    pages: int
