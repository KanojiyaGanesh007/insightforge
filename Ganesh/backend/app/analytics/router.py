"""API routes for AI insights and conversational assistant copilot."""

from uuid import UUID

from fastapi import APIRouter, Depends, status
from starlette.responses import Response

from app.analytics.llm.provider import get_llm_provider
from app.analytics.service import AssistantService, InsightService
from app.api.deps import DbSession, require_permission
from app.entities.user import UserEntity
from app.schemas.analytics import (
    ConversationCreate,
    ConversationResponse,
    InsightResponse,
    MessageCreate,
    MessageResponse,
)

router = APIRouter()


async def get_insight_service(db: DbSession) -> InsightService:
    """Dependency: retrieve initialized InsightService."""
    provider = get_llm_provider()
    return InsightService(db, provider)


async def get_assistant_service(db: DbSession) -> AssistantService:
    """Dependency: retrieve initialized AssistantService."""
    provider = get_llm_provider()
    return AssistantService(db, provider)


# 1. AI Insight Engine Endpoint
@router.get(
    "/datasets/{id}/insights",
    response_model=InsightResponse,
    dependencies=[Depends(require_permission("insights:read"))],
)
async def get_dataset_insights(
    id: UUID,
    current_user: UserEntity = Depends(require_permission("insights:read")),
    service: InsightService = Depends(get_insight_service),
) -> InsightResponse:
    """Retrieve or generate semantic data insights for a given dataset."""
    insights_dict = await service.get_or_generate_insights(id, current_user.id)
    return InsightResponse(
        positives=insights_dict.get("positives", []),
        warnings=insights_dict.get("warnings", []),
        risks=insights_dict.get("risks", []),
        opportunities=insights_dict.get("opportunities", []),
    )


# 2. Assistant Conversations lifecycle
@router.post(
    "/assistant/conversations",
    response_model=ConversationResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission("insights:generate"))],
)
async def create_conversation(
    body: ConversationCreate,
    current_user: UserEntity = Depends(require_permission("insights:generate")),
    service: AssistantService = Depends(get_assistant_service),
) -> ConversationResponse:
    """Create a new conversational copilot session for a dataset."""
    convo = await service.create_conversation(current_user.id, body.dataset_id, body.title)
    return ConversationResponse.model_validate(convo)


@router.get(
    "/assistant/conversations",
    response_model=list[ConversationResponse],
    dependencies=[Depends(require_permission("insights:read"))],
)
async def list_conversations(
    current_user: UserEntity = Depends(require_permission("insights:read")),
    service: AssistantService = Depends(get_assistant_service),
) -> list[ConversationResponse]:
    """List all active assistant conversation sessions."""
    convos = await service.list_conversations(current_user.id)
    return [ConversationResponse.model_validate(c) for c in convos]


@router.get(
    "/assistant/conversations/{id}",
    response_model=ConversationResponse,
    dependencies=[Depends(require_permission("insights:read"))],
)
async def get_conversation(
    id: UUID,
    current_user: UserEntity = Depends(require_permission("insights:read")),
    service: AssistantService = Depends(get_assistant_service),
) -> ConversationResponse:
    """Retrieve full message history of an active conversation."""
    convo = await service.get_conversation(id, current_user.id)
    return ConversationResponse.model_validate(convo)


@router.delete(
    "/assistant/conversations/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_permission("insights:generate"))],
)
async def delete_conversation(
    id: UUID,
    current_user: UserEntity = Depends(require_permission("insights:generate")),
    service: AssistantService = Depends(get_assistant_service),
) -> Response:
    """Soft delete an assistant conversation session."""
    await service.delete_conversation(id, current_user.id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/assistant/conversations/{id}/messages",
    response_model=MessageResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission("insights:generate"))],
)
async def send_message(
    id: UUID,
    body: MessageCreate,
    current_user: UserEntity = Depends(require_permission("insights:generate")),
    service: AssistantService = Depends(get_assistant_service),
) -> MessageResponse:
    """Post a user query and retrieve the AI analyst copilot response."""
    msg = await service.send_message(id, current_user.id, body.content)
    return MessageResponse.model_validate(msg)
