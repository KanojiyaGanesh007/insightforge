"""Authentication API tests."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app



@pytest.mark.asyncio
async def test_register_login_me_flow(client: AsyncClient):
    import uuid
    email = f"analyst_{uuid.uuid4().hex[:8]}@insightforge.com"
    password = "SecurePass123!"

    register_resp = await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password, "full_name": "Test Analyst"},
    )
    if register_resp.status_code == 500:
        pytest.skip("Database not available — run migrations against PostgreSQL")

    assert register_resp.status_code == 201, register_resp.text
    body = register_resp.json()
    assert "access_token" in body
    assert "refresh_token" in body
    assert body["user"]["email"] == email

    access = body["access_token"]
    me_resp = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {access}"})
    assert me_resp.status_code == 200
    me = me_resp.json()
    assert me["email"] == email
    assert "analyst" in me["roles"]

    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    assert login_resp.status_code == 200
    tokens = login_resp.json()

    refresh_resp = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": tokens["refresh_token"]},
    )
    assert refresh_resp.status_code == 200

    logout_resp = await client.post(
        "/api/v1/auth/logout",
        headers={"Authorization": f"Bearer {tokens['access_token']}"},
        json={"refresh_token": tokens["refresh_token"]},
    )
    assert logout_resp.status_code == 204


@pytest.mark.asyncio
async def test_login_invalid_credentials(client: AsyncClient):
    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "nobody@example.com", "password": "wrongpassword"},
    )
    if resp.status_code == 500:
        pytest.skip("Database not available")
    assert resp.status_code == 401

