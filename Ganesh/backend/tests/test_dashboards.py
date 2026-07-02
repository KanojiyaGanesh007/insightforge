"""Unit and integration tests for visualization studio and auto dashboards."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_dashboard_crud_lifecycle(auth_client: AsyncClient):
    # 1. Create manual dashboard
    create_payload = {"name": "Strategic Growth", "description": "Enterprise growth metrics"}
    create_resp = await auth_client.post("/api/v1/dashboards", json=create_payload)
    assert create_resp.status_code == 201
    db_data = create_resp.json()
    assert db_data["name"] == "Strategic Growth"
    db_id = db_data["id"]

    # 2. List dashboards
    list_resp = await auth_client.get("/api/v1/dashboards")
    assert list_resp.status_code == 200
    dashboards = list_resp.json()
    assert any(d["id"] == db_id for d in dashboards)

    # 3. Patch dashboard
    patch_payload = {"name": "Strategic Growth V2"}
    patch_resp = await auth_client.patch(f"/api/v1/dashboards/{db_id}", json=patch_payload)
    assert patch_resp.status_code == 200
    assert patch_resp.json()["name"] == "Strategic Growth V2"

    # 4. Soft delete dashboard
    del_resp = await auth_client.delete(f"/api/v1/dashboards/{db_id}")
    assert del_resp.status_code == 204

    # 5. Verify deletion
    verify_resp = await auth_client.get(f"/api/v1/dashboards/{db_id}")
    assert verify_resp.status_code == 404


@pytest.mark.asyncio
async def test_widget_creation_and_pandas_aggregation(auth_client: AsyncClient):
    # 1. Upload sample CSV dataset
    csv_data = "segment,revenue\nMidmarket,1200\nEnterprise,2500\nMidmarket,1300\n"
    files = {"file": ("test_studio.csv", csv_data.encode("utf-8"), "text/csv")}
    upload_resp = await auth_client.post("/api/v1/datasets/upload", files=files)
    assert upload_resp.status_code == 201
    dataset_id = upload_resp.json()["id"]

    # 2. Create a dashboard
    db_resp = await auth_client.post("/api/v1/dashboards", json={"name": "Sales Ops"})
    assert db_resp.status_code == 201
    db_id = db_resp.json()["id"]

    # 3. Add widget with SUM aggregation
    widget_payload = {
        "dataset_id": dataset_id,
        "title": "Revenue by Segment",
        "chart_type": "bar",
        "x_axis": "segment",
        "y_axis": "revenue",
        "aggregate_func": "sum",
        "color_palette": "indigo",
        "layout_x": 0,
        "layout_y": 0,
        "layout_w": 6,
        "layout_h": 4,
    }
    widget_resp = await auth_client.post(f"/api/v1/dashboards/{db_id}/widgets", json=widget_payload)
    assert widget_resp.status_code == 201
    widget = widget_resp.json()
    assert widget["title"] == "Revenue by Segment"
    widget_id = widget["id"]

    # 4. Retrieve dynamic aggregated chart data
    data_resp = await auth_client.get(f"/api/v1/dashboards/widgets/{widget_id}/data")
    assert data_resp.status_code == 200
    aggregated_payload = data_resp.json()
    assert aggregated_payload["widget_id"] == widget_id
    
    data_list = aggregated_payload["data"]
    # Check that segments were aggregated correctly: Midmarket sum = 1200 + 1300 = 2500, Enterprise = 2500
    assert len(data_list) == 2
    midmarket = next(item for item in data_list if item["segment"] == "Midmarket")
    enterprise = next(item for item in data_list if item["segment"] == "Enterprise")
    assert midmarket["revenue"] == 2500.0
    assert enterprise["revenue"] == 2500.0

    # 5. Delete Widget
    del_resp = await auth_client.delete(f"/api/v1/dashboards/{db_id}/widgets/{widget_id}")
    assert del_resp.status_code == 204


@pytest.mark.asyncio
async def test_auto_dashboard_generation(auth_client: AsyncClient):
    # 1. Upload CSV dataset with Date, Category, and Numeric columns
    csv_data = "date,category,sales\n2026-01-01,Tech,500\n2026-01-02,Food,300\n"
    files = {"file": ("test_auto_db.csv", csv_data.encode("utf-8"), "text/csv")}
    upload_resp = await auth_client.post("/api/v1/datasets/upload", files=files)
    assert upload_resp.status_code == 201
    dataset_id = upload_resp.json()["id"]

    # 2. Trigger auto dashboard generation
    auto_resp = await auth_client.post(f"/api/v1/dashboards/auto-generate/{dataset_id}")
    assert auto_resp.status_code == 201
    dashboard = auto_resp.json()
    assert dashboard["is_auto_generated"] is True
    assert len(dashboard["widgets"]) >= 2
    
    # 3. Verify widgets details
    widgets = dashboard["widgets"]
    assert any(w["chart_type"] == "line" for w in widgets)
    assert any(w["chart_type"] == "bar" for w in widgets)
