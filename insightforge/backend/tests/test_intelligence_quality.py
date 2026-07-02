"""Dataset Intelligence and Data Quality API tests."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_dataset_intelligence_profiling(auth_client: AsyncClient):
    # Upload a typical sales dataset
    csv_data = (
        "date,product,price,quantity,revenue,city\n"
        "2026-01-01,Product A,10.0,2,20.0,New York\n"
        "2026-01-02,Product B,15.5,1,15.5,Los Angeles\n"
        "2026-01-03,Product A,10.0,4,40.0,Chicago\n"
        "2026-01-04,Product C,20.0,3,60.0,New York\n"
    )
    files = {"file": ("sales_data.csv", csv_data.encode("utf-8"), "text/csv")}

    upload_resp = await auth_client.post("/api/v1/datasets/upload", files=files)
    assert upload_resp.status_code == 201
    dataset_id = upload_resp.json()["id"]

    # Fetch intelligence
    intel_resp = await auth_client.get(f"/api/v1/datasets/{dataset_id}/intelligence")
    assert intel_resp.status_code == 200
    intel = intel_resp.json()

    assert intel["dataset_type"] == "sales"
    assert intel["confidence_score"] > 50.0

    columns = intel["columns"]
    # Check column logical types
    date_col = next(c for c in columns if c["name"] == "date")
    assert date_col["type"] == "date"
    assert "min_date" in date_col["profile"]

    price_col = next(c for c in columns if c["name"] == "price")
    assert price_col["type"] == "numeric"
    assert price_col["profile"]["mean"] == 13.875

    city_col = next(c for c in columns if c["name"] == "city")
    assert city_col["type"] == "geographic"
    assert city_col["profile"]["category_counts"]["New York"] == 2


@pytest.mark.asyncio
async def test_dataset_data_quality(auth_client: AsyncClient):
    # Upload a dataset containing duplicates and null values
    csv_data = (
        "name,age,email\n"
        "Alice,30,alice@test.com\n"
        "Bob,,bob@test.com\n"
        "Alice,30,alice@test.com\n"  # Duplicate row
        "Charlie,25,\n"             # Null email
    )
    files = {"file": ("dirty_data.csv", csv_data.encode("utf-8"), "text/csv")}

    upload_resp = await auth_client.post("/api/v1/datasets/upload", files=files)
    assert upload_resp.status_code == 201
    dataset_id = upload_resp.json()["id"]

    # Fetch quality details
    quality_resp = await auth_client.get(f"/api/v1/datasets/{dataset_id}/quality")
    assert quality_resp.status_code == 200
    quality = quality_resp.json()

    overall = quality["overall"]
    assert overall["total_rows"] == 4
    assert overall["duplicate_rows"] == 1
    assert overall["duplicate_percentage"] == 25.0

    # Age column should have 1 null value (25%)
    columns = quality["columns"]
    assert columns["age"]["null_count"] == 1
    assert columns["age"]["null_percentage"] == 25.0

    # Email should have 1 null value (25%)
    assert columns["email"]["null_count"] == 1

    # Quality issues list should contain duplicate warning
    issues = quality["issues"]
    assert any(iss["type"] == "duplicates" for iss in issues)
    assert any(iss["type"] == "missing_values" for iss in issues)
