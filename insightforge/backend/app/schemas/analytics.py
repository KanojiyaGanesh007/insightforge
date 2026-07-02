"""Pydantic schemas for the analytics and assistant endpoints."""

from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict


class InsightResponse(BaseModel):
    positives: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    risks: list[str] = Field(default_factory=list)
    opportunities: list[str] = Field(default_factory=list)


class ConversationCreate(BaseModel):
    dataset_id: UUID
    title: str | None = Field(default=None, max_length=255)


class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    conversation_id: UUID
    role: str
    content: str
    created_at: datetime


class ConversationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    dataset_id: UUID
    title: str
    created_at: datetime
    updated_at: datetime
    messages: list[MessageResponse] = Field(default_factory=list)


class MessageCreate(BaseModel):
    content: str = Field(..., min_length=1)
