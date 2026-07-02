# InsightForge AI — Backend Architecture

## Folder Structure & Purpose

```
backend/
├── app/                          # Application package (Clean Architecture)
│   ├── main.py                   # FastAPI app factory & lifespan
│   ├── api/                      # HTTP layer — routers, dependencies
│   ├── core/                     # Config, security, logging, DI, exceptions
│   ├── database/                 # Engine, session, base model, mixins
│   ├── models/                   # SQLAlchemy ORM models (persistence)
│   ├── entities/                 # Domain entities (business objects)
│   ├── repositories/             # Data access interfaces & implementations
│   ├── services/                 # Application / use-case services
│   ├── schemas/                  # Pydantic DTOs (request/response)
│   ├── mappers/                  # Entity ↔ Model ↔ DTO conversions
│   ├── middleware/               # Request/response middleware
│   ├── auth/                     # Authentication module (router, service, seed)
│   ├── analytics/                # AI Insight & Analytics Assistant
│   ├── dashboards/               # Visualization & Auto Dashboard
│   ├── datasets/                 # Upload & Dataset Intelligence
│   ├── ml/                       # Machine Learning Center
│   ├── reports/                  # Report Center
│   ├── notifications/            # Notification Center
│   ├── audit/                    # Audit Logs
│   └── utils/                    # Shared helpers
├── alembic/                      # Database migrations
├── tests/                        # pytest suite
├── requirements.txt
└── .env.example
```

## Layer Responsibilities

| Layer | Responsibility |
|-------|----------------|
| **api** | HTTP routing, dependency injection wiring, no business logic |
| **core** | Cross-cutting: settings, JWT, logging, global exception handlers |
| **database** | Async engine, session factory, declarative base, mixins |
| **models** | SQLAlchemy table definitions |
| **entities** | Pure domain objects, validation rules |
| **repositories** | CRUD & queries; abstract interfaces for testability |
| **services** | Orchestrate use cases; call repositories & external APIs |
| **schemas** | API contracts (Pydantic v2) |
| **mappers** | Convert between layers without leaking ORM to API |
| **middleware** | Correlation ID, timing, security headers |
| **Feature modules** | Domain-specific routes, services, repos co-located by feature |

## Request Flow

```
Client → Middleware → API Router → Depends(get_service) → Service → Repository → DB
                                      ↓
                              Schema (DTO) ← Mapper ← Entity
```

## Dependency Injection

`app/api/deps.py` provides `DbSession`, `CurrentUser`, `AuthServiceDep`, and RBAC factories (`require_roles`, `require_permission`).

## Running Locally

1. PostgreSQL running with credentials in `.env`
2. `alembic upgrade head`
3. `uvicorn app.main:app --reload`

RBAC roles and permissions are seeded automatically on application startup.
