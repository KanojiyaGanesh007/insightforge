# InsightForge AI — Backend

Enterprise SaaS backend for dataset intelligence, AI analytics, and dashboards.

## Stack

- FastAPI · PostgreSQL · SQLAlchemy 2.0 · Alembic · Pydantic v2 · JWT

## Local setup (Windows / macOS / Linux)

### 1. Install dependencies

```powershell
cd backend
pip install -r requirements.txt
```

### 2. Configure PostgreSQL

Copy `.env.example` to `.env` and set **`POSTGRES_HOST=localhost`** (not `postgres`, which is only valid inside Docker).

Ensure PostgreSQL is running and the database exists:

```sql
CREATE USER insightforge WITH PASSWORD 'your_password';
CREATE DATABASE insightforge_db OWNER insightforge;
```

### 3. Run migrations and start the API

On Windows, `alembic` and `uvicorn` are often **not on PATH** after `pip install`. Use the module form:

```powershell
python -m alembic upgrade head
python -m uvicorn app.main:app --reload --port 8000
```

Optional: add Python Scripts to PATH (replace with your Python version):

`C:\Users\<you>\AppData\Local\Python\pythoncore-3.14-64\Scripts`

Then `alembic` and `uvicorn` work without `python -m`.

### 4. Verify

- Health: http://localhost:8000/api/v1/health
- API docs: http://localhost:8000/docs

## Commands

| Command | Description |
|---------|-------------|
| `python -m alembic upgrade head` | Apply migrations |
| `python -m alembic revision --autogenerate -m "msg"` | New migration |
| `python -m pytest` | Run tests |
| `python -m uvicorn app.main:app --reload` | Dev server |

## Project layout

See [docs/BACKEND_ARCHITECTURE.md](../docs/BACKEND_ARCHITECTURE.md) and [docs/IMPLEMENTATION_ROADMAP.md](../docs/IMPLEMENTATION_ROADMAP.md).

## Phase status

- **Phase 0–1:** Foundation + Auth/RBAC (current)
- **Phase 2+:** See implementation roadmap
