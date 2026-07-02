"""Dataset API endpoints tests."""

import io
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_upload_csv_dataset(auth_client: AsyncClient):
    csv_data = "name,age,city\nAlice,30,New York\nBob,25,Los Angeles\nCharlie,35,Chicago"
    file_bytes = csv_data.encode("utf-8")

    files = {"file": ("test_people.csv", file_bytes, "text/csv")}
    data = {"name": "Test People Dataset"}

    resp = await auth_client.post(
        "/api/v1/datasets/upload",
        files=files,
        data=data,
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["name"] == "Test People Dataset"
    assert body["file_format"] == "csv"
    assert "id" in body


@pytest.mark.asyncio
async def test_list_datasets(auth_client: AsyncClient):
    # Upload first
    csv_data = "col1,col2\n1,2\n3,4"
    files = {"file": ("data.csv", csv_data.encode("utf-8"), "text/csv")}

    upload_resp = await auth_client.post("/api/v1/datasets/upload", files=files)
    assert upload_resp.status_code == 201

    list_resp = await auth_client.get("/api/v1/datasets")
    assert list_resp.status_code == 200
    datasets = list_resp.json()
    assert len(datasets) >= 1
    assert any(d["file_name"] == "data.csv" for d in datasets)


@pytest.mark.asyncio
async def test_get_dataset_and_preview(auth_client: AsyncClient):
    csv_data = "id,score\n1,95.5\n2,88.0\n3,92.3"
    files = {"file": ("scores.csv", csv_data.encode("utf-8"), "text/csv")}

    upload_resp = await auth_client.post("/api/v1/datasets/upload", files=files)
    assert upload_resp.status_code == 201
    dataset_id = upload_resp.json()["id"]

    # Get details
    details_resp = await auth_client.get(f"/api/v1/datasets/{dataset_id}")
    assert details_resp.status_code == 200
    details = details_resp.json()
    assert details["name"] == "scores"
    assert details["metadata"]["schema_json"]["row_count"] == 3
    assert details["metadata"]["schema_json"]["column_count"] == 2

    # Get preview
    preview_resp = await auth_client.get(f"/api/v1/datasets/{dataset_id}/preview")
    assert preview_resp.status_code == 200
    preview = preview_resp.json()
    assert preview["columns"] == ["id", "score"]
    assert len(preview["rows"]) == 3
    assert preview["rows"][0]["id"] == 1
    assert preview["rows"][0]["score"] == 95.5


@pytest.mark.asyncio
async def test_delete_dataset(auth_client: AsyncClient):
    csv_data = "x,y\n10,20"
    files = {"file": ("temp.csv", csv_data.encode("utf-8"), "text/csv")}

    upload_resp = await auth_client.post("/api/v1/datasets/upload", files=files)
    assert upload_resp.status_code == 201
    dataset_id = upload_resp.json()["id"]

    # Delete
    del_resp = await auth_client.delete(f"/api/v1/datasets/{dataset_id}")
    assert del_resp.status_code == 204

    # Try get (should be 404)
    get_resp = await auth_client.get(f"/api/v1/datasets/{dataset_id}")
    assert get_resp.status_code == 404


@pytest.mark.asyncio
async def test_invalid_extension(auth_client: AsyncClient):
    files = {"file": ("doc.txt", b"some text content", "text/plain")}
    resp = await auth_client.post("/api/v1/datasets/upload", files=files)
    assert resp.status_code == 400
    assert "Invalid file format" in resp.json()["error"]["message"]


@pytest.mark.asyncio
async def test_unauthorized_access(client: AsyncClient):
    # Try listing without auth header
    resp = await client.get("/api/v1/datasets")
    assert resp.status_code == 401
