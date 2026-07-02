"""Services for AI insights generation and assistant conversational copilot."""

import json
import os
import uuid
from typing import Any

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.analytics.llm.provider import LLMProvider
from app.core.exceptions import NotFoundError
from app.core.logging import get_logger
from app.models.assistant import Conversation, ConversationMessage
from app.models.dataset import Dataset, DatasetMetadata

logger = get_logger(__name__)


class InsightService:
    """Service to handle automated business insights generation."""

    def __init__(self, db: AsyncSession, llm_provider: LLMProvider):
        self.db = db
        self.llm_provider = llm_provider

    async def get_or_generate_insights(self, dataset_id: uuid.UUID, user_id: uuid.UUID) -> dict[str, list[str]]:
        """Fetch cached insights from metadata, or generate and store them."""
        # 1. Fetch metadata
        query = select(DatasetMetadata).join(Dataset).where(
            Dataset.id == dataset_id,
            Dataset.user_id == user_id
        )
        result = await self.db.execute(query)
        metadata = result.scalar_one_or_none()

        if not metadata:
            raise NotFoundError("Dataset metadata not found")

        profile = metadata.profile_json or {}
        
        # If insights already exist, return them
        if "insights" in profile:
            return profile["insights"]

        # 2. Generate insights
        insights = await self._generate_insights(metadata)
        
        # 3. Cache insights
        profile["insights"] = insights
        metadata.profile_json = profile
        self.db.add(metadata)
        await self.db.commit()
        await self.db.refresh(metadata)
        
        return insights

    async def _generate_insights(self, metadata: DatasetMetadata) -> dict[str, list[str]]:
        """Generate structured insights using the active LLM provider or local rules fallback."""
        schema = metadata.schema_json or {}
        quality = (metadata.profile_json or {}).get("quality", {})
        
        # Construct summary data
        columns = schema.get("columns", [])
        dataset_type = metadata.dataset_type or "general"
        row_count = schema.get("row_count", 0)

        # Basic Rules Heuristics
        positives = []
        warnings = []
        risks = []
        opportunities = []

        # Domain specific opportunity
        if dataset_type == "sales":
            opportunities.append("Perform product category revenue breakdown to isolate low-margin items.")
            opportunities.append("Visualize sales volumes over time to locate peak seasonal trends.")
        elif dataset_type == "customer":
            opportunities.append("Segment customers by geographic density and user profile status.")
            opportunities.append("Correlate signup dates with user activity to compute retention indexes.")
        else:
            opportunities.append("Perform cross-tabulation of categorical fields to uncover segment weights.")

        # Quality-based warning
        overall = quality.get("overall", {})
        duplicate_percentage = overall.get("duplicate_percentage", 0.0)
        outlier_count = overall.get("outlier_count", 0)
        completeness_score = overall.get("completeness_score", 100.0)

        if duplicate_percentage > 0.0:
            warnings.append(f"Identified duplicate records ({duplicate_percentage:.1f}% duplicate rate). Deduplicate before modeling.")
        if outlier_count > 0:
            risks.append(f"Statistical anomalies: found {outlier_count} numeric outliers via IQR bounds.")
            opportunities.append("Visualize numeric field outliers using box plots to evaluate data cleansing options.")
        if completeness_score < 100.0:
            warnings.append(f"Dataset completeness is degraded ({completeness_score:.1f}% complete). Columns contain null cells.")
        else:
            positives.append("Dataset features 100% completeness; no missing cell values detected.")

        # Column logical types heuristics
        for col in columns:
            col_name = col.get("name", "")
            col_type = col.get("type", "")
            col_profile = col.get("profile", {})
            
            if col_type == "geographic":
                positives.append(f"Geographic column '{col_name}' detected; enables map-based visualizations.")
            elif col_type == "date":
                opportunities.append(f"Use date column '{col_name}' to forecast numeric trends over time.")
            elif col_type == "numeric" and col_profile.get("unique_percentage", 100) < 5.0:
                positives.append(f"Low-cardinality numeric column '{col_name}' could be used for chart facets/grouping.")

        fallback_insights = {
            "positives": positives or ["Logical schema types correctly inferred."],
            "warnings": warnings or ["No critical structural warnings detected."],
            "risks": risks or ["No statistical risks detected."],
            "opportunities": opportunities or ["Create multi-dimensional pivots to locate core trends."]
        }

        # Try utilizing OpenAI if api key is present
        api_key = os.environ.get("OPENAI_API_KEY")
        if not api_key:
            return fallback_insights

        # OpenAI context assembly
        system_prompt = (
            "You are a Senior Business Intelligence and Data Analyst.\n"
            "Given the metadata, schema, and quality report of a dataset, generate structured insights in JSON format.\n"
            "The JSON must strictly match this structure:\n"
            "{\n"
            "  \"positives\": [\"string\"],\n"
            "  \"warnings\": [\"string\"],\n"
            "  \"risks\": [\"string\"],\n"
            "  \"opportunities\": [\"string\"]\n"
            "}\n"
            "Limit responses to 3 bullet points per category. Keep sentences short, professional, and actionable."
        )

        input_data = {
            "dataset_type": dataset_type,
            "row_count": row_count,
            "columns": [{"name": c["name"], "type": c["type"]} for c in columns],
            "quality_overview": overall,
            "rules_fallback": fallback_insights
        }

        messages = [{"role": "user", "content": f"Dataset Summary:\n{json.dumps(input_data)}"}]

        try:
            raw_response = await self.llm_provider.generate_response(system_prompt, messages, temperature=0.2)
            # Remove markdown code fencing if returned
            clean_json = raw_response.strip()
            if clean_json.startswith("```json"):
                clean_json = clean_json[7:]
            if clean_json.endswith("```"):
                clean_json = clean_json[:-3]
            
            parsed = json.loads(clean_json.strip())
            return {
                "positives": parsed.get("positives", fallback_insights["positives"]),
                "warnings": parsed.get("warnings", fallback_insights["warnings"]),
                "risks": parsed.get("risks", fallback_insights["risks"]),
                "opportunities": parsed.get("opportunities", fallback_insights["opportunities"])
            }
        except Exception as e:
            logger.error("openai_insights_generation_failed", error=str(e))
            return fallback_insights


class AssistantService:
    """Service to manage assistant conversations and messages."""

    def __init__(self, db: AsyncSession, llm_provider: LLMProvider):
        self.db = db
        self.llm_provider = llm_provider

    async def create_conversation(self, user_id: uuid.UUID, dataset_id: uuid.UUID, title: str | None = None) -> Conversation:
        """Create a new chat conversation session."""
        # Verify dataset exists and belongs to user
        query = select(Dataset).where(Dataset.id == dataset_id, Dataset.user_id == user_id)
        result = await self.db.execute(query)
        dataset = result.scalar_one_or_none()
        if not dataset:
            raise NotFoundError("Dataset not found")

        convo_title = title or f"Conversation: {dataset.name}"
        conversation = Conversation(
            user_id=user_id,
            dataset_id=dataset_id,
            title=convo_title
        )
        self.db.add(conversation)
        await self.db.commit()
        await self.db.refresh(conversation)
        return conversation

    async def list_conversations(self, user_id: uuid.UUID) -> list[Conversation]:
        """List all active assistant conversations for a user."""
        query = select(Conversation).where(
            Conversation.user_id == user_id,
            Conversation.deleted_at.is_(None)
        ).order_by(Conversation.updated_at.desc())
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_conversation(self, conversation_id: uuid.UUID, user_id: uuid.UUID) -> Conversation:
        """Get conversation details along with messages."""
        query = select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == user_id,
            Conversation.deleted_at.is_(None)
        )
        result = await self.db.execute(query)
        convo = result.scalar_one_or_none()
        if not convo:
            raise NotFoundError("Conversation not found")
        return convo

    async def delete_conversation(self, conversation_id: uuid.UUID, user_id: uuid.UUID) -> None:
        """Delete an assistant conversation session."""
        # Fetch conversation
        convo = await self.get_conversation(conversation_id, user_id)
        
        # Perform soft delete
        await self.db.delete(convo)
        await self.db.commit()

    async def send_message(self, conversation_id: uuid.UUID, user_id: uuid.UUID, content: str) -> ConversationMessage:
        """Post a user query, build prompt context, and trigger assistant reply."""
        # 1. Fetch conversation
        convo = await self.get_conversation(conversation_id, user_id)

        # 2. Fetch dataset metadata & insights
        meta_query = select(DatasetMetadata).where(DatasetMetadata.dataset_id == convo.dataset_id)
        meta_result = await self.db.execute(meta_query)
        metadata = meta_result.scalar_one_or_none()

        if not metadata:
            raise NotFoundError("Dataset metadata is missing")

        # Get or generate insights to append to prompt
        insight_service = InsightService(self.db, self.llm_provider)
        insights = await insight_service.get_or_generate_insights(convo.dataset_id, user_id)

        # 3. Create User Message
        user_message = ConversationMessage(
            conversation_id=conversation_id,
            role="user",
            content=content
        )
        self.db.add(user_message)
        await self.db.commit()
        await self.db.refresh(user_message)

        # 4. Assemble dataset context prompts
        schema = metadata.schema_json or {}
        quality = (metadata.profile_json or {}).get("quality", {})

        cols_desc = []
        for col in schema.get("columns", []):
            cols_desc.append(f"- Name: {col['name']}, Logical Type: {col['type']}, Unique %: {col.get('profile', {}).get('unique_percentage', 100):.1f}%")
        
        quality_desc = []
        overall = quality.get("overall", {})
        quality_desc.append(f"- Overall Quality Score: {overall.get('quality_score', 100.0):.1f}%")
        quality_desc.append(f"- Completeness Score: {overall.get('completeness_score', 100.0):.1f}%")
        quality_desc.append(f"- Duplicate rows: {overall.get('duplicate_rows', 0)} ({overall.get('duplicate_percentage', 0.0):.1f}%)")
        quality_desc.append(f"- Numeric Outliers: {overall.get('outlier_count', 0)}")
        
        insights_desc = []
        for cat, items in insights.items():
            insights_desc.append(f"Category: {cat.upper()}")
            for item in items:
                insights_desc.append(f"  * {item}")

        system_prompt = (
            "You are an AI Business Intelligence Analyst assistant for InsightForge AI.\n"
            "You are helping a user analyze their dataset.\n\n"
            f"Dataset Name: {convo.dataset.name if convo.dataset else 'User Dataset'}\n"
            f"<DATASET_TYPE>\n{metadata.dataset_type or 'general'}\n</DATASET_TYPE>\n\n"
            f"<COLUMNS>\n" + "\n".join(cols_desc) + "\n</COLUMNS>\n\n"
            f"<QUALITY>\n" + "\n".join(quality_desc) + "\n</QUALITY>\n\n"
            f"<INSIGHTS>\n" + "\n".join(insights_desc) + "\n</INSIGHTS>\n\n"
            "Provide accurate, direct responses. Do not hallucinate. Use formatting, headers, or bullet points where useful."
        )

        # 5. Compile chat history
        # (Filter out messages that belong to this conversation)
        message_history = []
        for msg in convo.messages:
            # We don't include the newly added user message yet since it's passed as part of generate_response,
            # but wait, since the provider receives the messages list, we should include all messages in order!
            # convo.messages selectin loads messages order_by created_at.asc()
            message_history.append({"role": msg.role, "content": msg.content})

        try:
            # 6. Generate reply
            assistant_reply = await self.llm_provider.generate_response(
                system_prompt=system_prompt,
                messages=message_history,
                temperature=0.7
            )
        except Exception as e:
            logger.error("llm_generation_failed", error=str(e))
            assistant_reply = "I apologize, but I encountered an error while communicating with the AI completions server. Please try again."

        # 7. Save Assistant Message
        assistant_message = ConversationMessage(
            conversation_id=conversation_id,
            role="assistant",
            content=assistant_reply
        )
        self.db.add(assistant_message)
        await self.db.commit()
        await self.db.refresh(assistant_message)

        # Re-fetch conversation to trigger selective relation updates
        await self.db.refresh(convo)

        return assistant_message
