"""Unit and integration tests for AI insights and analytics assistant copilot."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_dataset_insights(auth_client: AsyncClient):
    # 1. Upload a dataset first
    csv_data = "date,quantity,revenue\n2026-01-01,10,100.0\n2026-01-02,15,150.0\n"
    files = {"file": ("test_sales.csv", csv_data.encode("utf-8"), "text/csv")}

    upload_resp = await auth_client.post("/api/v1/datasets/upload", files=files)
    assert upload_resp.status_code == 201
    dataset_id = upload_resp.json()["id"]

    # 2. Request insights
    insights_resp = await auth_client.get(f"/api/v1/datasets/{dataset_id}/insights")
    assert insights_resp.status_code == 200
    insights = insights_resp.json()

    assert "positives" in insights
    assert "warnings" in insights
    assert "risks" in insights
    assert "opportunities" in insights
    assert len(insights["opportunities"]) > 0


@pytest.mark.asyncio
async def test_assistant_conversation_lifecycle(auth_client: AsyncClient):
    # 1. Upload a dataset
    csv_data = "date,quantity,revenue\n2026-01-01,10,100.0\n"
    files = {"file": ("test_life.csv", csv_data.encode("utf-8"), "text/csv")}
    upload_resp = await auth_client.post("/api/v1/datasets/upload", files=files)
    assert upload_resp.status_code == 201
    dataset_id = upload_resp.json()["id"]

    # 2. Create conversation
    create_payload = {"dataset_id": dataset_id, "title": "Test Convo"}
    convo_resp = await auth_client.post("/api/v1/assistant/conversations", json=create_payload)
    assert convo_resp.status_code == 201
    convo = convo_resp.json()
    assert convo["title"] == "Test Convo"
    assert convo["dataset_id"] == dataset_id
    convo_id = convo["id"]

    # 3. List conversations
    list_resp = await auth_client.get("/api/v1/assistant/conversations")
    assert list_resp.status_code == 200
    convos = list_resp.json()
    assert any(c["id"] == convo_id for c in convos)

    # 4. Send a message to the assistant
    msg_payload = {"content": "Tell me about my column types"}
    msg_resp = await auth_client.post(
        f"/api/v1/assistant/conversations/{convo_id}/messages",
        json=msg_payload
    )
    assert msg_resp.status_code == 201
    msg_data = msg_resp.json()
    assert msg_data["role"] == "assistant"
    assert "Schema" in msg_data["content"] or "Column" in msg_data["content"]

    # 5. Retrieve conversation details (to verify message history contains 2 messages: user + assistant)
    detail_resp = await auth_client.get(f"/api/v1/assistant/conversations/{convo_id}")
    assert detail_resp.status_code == 200
    detail = detail_resp.json()
    assert len(detail["messages"]) == 2
    assert detail["messages"][0]["role"] == "user"
    assert detail["messages"][1]["role"] == "assistant"

    # 6. Delete conversation
    delete_resp = await auth_client.delete(f"/api/v1/assistant/conversations/{convo_id}")
    assert delete_resp.status_code == 204

    # 7. Verify deletion
    verify_resp = await auth_client.get(f"/api/v1/assistant/conversations/{convo_id}")
    assert verify_resp.status_code == 404
