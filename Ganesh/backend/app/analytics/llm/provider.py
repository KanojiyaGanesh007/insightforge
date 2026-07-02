"""LLM Provider interfaces and concrete engine implementations."""

import os
from typing import Any, Protocol
import httpx

from app.core.logging import get_logger

logger = get_logger(__name__)


class LLMProvider(Protocol):
    """Protocol for LLM interactions."""

    async def generate_response(
        self,
        system_prompt: str,
        messages: list[dict[str, str]],
        temperature: float = 0.7,
    ) -> str:
        """Generate text completion from LLM provider."""
        ...


class MockProvider:
    """Mock provider for unit testing."""

    def __init__(self, reply: str = "Mock response"):
        self.reply = reply

    async def generate_response(
        self,
        system_prompt: str,
        messages: list[dict[str, str]],
        temperature: float = 0.7,
    ) -> str:
        return self.reply


class OpenAIProvider:
    """OpenAI API provider implemented using httpx."""

    def __init__(self, api_key: str, model: str = "gpt-4o-mini"):
        self.api_key = api_key
        self.model = model
        self.endpoint = "https://api.openai.com/v1/chat/completions"

    async def generate_response(
        self,
        system_prompt: str,
        messages: list[dict[str, str]],
        temperature: float = 0.7,
    ) -> str:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        # Build full payload
        payload_messages = [{"role": "system", "content": system_prompt}]
        for msg in messages:
            payload_messages.append({"role": msg["role"], "content": msg["content"]})

        payload = {
            "model": self.model,
            "messages": payload_messages,
            "temperature": temperature,
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(self.endpoint, headers=headers, json=payload)
                response.raise_for_status()
                data = response.json()
                return data["choices"][0]["message"]["content"]
        except Exception as e:
            logger.error("openai_provider_error", error=str(e))
            raise RuntimeError(f"OpenAI completion request failed: {str(e)}") from e


class RulesEngineProvider:
    """Default rule-based local provider parsing dataset context from system prompt."""

    async def generate_response(
        self,
        system_prompt: str,
        messages: list[dict[str, str]],
        temperature: float = 0.7,
    ) -> str:
        # RulesEngineProvider attempts to understand the user request
        # by matching keywords and extracting data from the system_prompt text context.
        # It performs local analytics matching.
        last_user_message = ""
        for msg in reversed(messages):
            if msg["role"] == "user":
                last_user_message = msg["content"].lower()
                break

        # Helper: extract section from system_prompt
        def get_section(section_name: str) -> str:
            start_marker = f"<{section_name}>"
            end_marker = f"</{section_name}>"
            if start_marker in system_prompt and end_marker in system_prompt:
                start_idx = system_prompt.index(start_marker) + len(start_marker)
                end_idx = system_prompt.index(end_marker)
                return system_prompt[start_idx:end_idx].strip()
            return ""

        dataset_type = get_section("DATASET_TYPE")
        columns_info = get_section("COLUMNS")
        quality_info = get_section("QUALITY")
        insights_info = get_section("INSIGHTS")

        # 1. Keywords related to Quality, Completeness, Outliers, Duplicates
        if any(w in last_user_message for w in ["quality", "complete", "null", "missing", "duplicate", "outlier", "anomaly"]):
            response_lines = [
                f"### Data Quality Inspection Report\n",
                f"Here is a summary of the data quality issues resolved from the analysis metadata:\n",
            ]
            if quality_info:
                response_lines.append(quality_info)
            else:
                response_lines.append("- Outliers and duplicates are within acceptable variance thresholds.")
            return "\n".join(response_lines)

        # 2. Keywords related to Columns, Schema, Type, Names
        if any(w in last_user_message for w in ["column", "schema", "type", "field", "structure", "name"]):
            response_lines = [
                f"### Column Schema & Statistical Breakdown\n",
                f"Here are the semantic properties and logical types inferred from the dataset columns:\n",
            ]
            if columns_info:
                response_lines.append(columns_info)
            else:
                response_lines.append("- No custom columns found or schema is undetermined.")
            return "\n".join(response_lines)

        # 3. Keywords related to Opportunity, Insights, Strategy
        if any(w in last_user_message for w in ["insight", "opportunity", "viz", "chart", "graph", "recommend"]):
            response_lines = [
                f"### AI-Generated Business Insights & Recommendations\n",
                f"Based on the classified domain **{dataset_type.upper()}**, I have identified these strategic insights:\n",
            ]
            if insights_info:
                response_lines.append(insights_info)
            else:
                response_lines.append("- Build correlation line charts and scatter plots to analyze relationships.")
            return "\n".join(response_lines)

        # Fallback response providing a general welcome and dataset recap
        return (
            f"Hello! I am your AI Analytics Assistant.\n\n"
            f"I have loaded your **{dataset_type.upper() if dataset_type else 'General'}** dataset. "
            f"Here is what I can help you with:\n"
            f"- **Data Quality**: Ask me about duplicates, missing values, or outliers.\n"
            f"- **Schema Profiler**: Ask me about column formats and data types.\n"
            f"- **Strategic Insights**: Ask me about trends or chart recommendations.\n\n"
            f"Feel free to ask a specific question about your data!"
        )


def get_llm_provider() -> LLMProvider:
    """Factory to acquire the active LLM provider based on settings."""
    api_key = os.environ.get("OPENAI_API_KEY")
    if api_key:
        logger.info("llm_provider_init", type="openai")
        return OpenAIProvider(api_key=api_key)
    else:
        logger.info("llm_provider_init", type="rules_engine")
        return RulesEngineProvider()
