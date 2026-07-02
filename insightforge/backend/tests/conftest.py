"""Pytest fixtures."""

import os
os.environ["TESTING"] = "true"

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app



@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture(scope="session", autouse=True)
async def cleanup_database_engine():
    yield
    from app.database.session import engine
    await engine.dispose()


@pytest.fixture
async def auth_client(client: AsyncClient):
    import uuid
    email = f"analyst_{uuid.uuid4().hex[:8]}@insightforge.com"
    password = "SecurePass123!"

    # Register
    await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password, "full_name": "Test Analyst"},
    )

    # Login
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    tokens = login_resp.json()
    access = tokens["access_token"]

    transport = ASGITransport(app=app)
    async with AsyncClient(
        transport=transport,
        base_url="http://test",
        headers={"Authorization": f"Bearer {access}"},
    ) as ac:
        yield ac


