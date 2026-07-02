# InsightForge AI — Complete Folder Structure

## Repository Root

```
Ganesh/
├── backend/                 # FastAPI application
├── frontend/                # React SPA
└── docs/                    # Architecture & design documents
```

## Backend (`backend/`)

```
backend/
├── alembic/
│   ├── versions/            # Migration scripts
│   ├── env.py
│   └── script.py.mako
├── alembic.ini
├── app/
│   ├── main.py              # App factory
│   ├── api/
│   │   ├── deps.py          # DB session, current user, RBAC
│   │   └── v1/
│   │       ├── router.py    # Aggregates v1 routers
│   │       └── endpoints/
│   │           └── health.py
│   ├── auth/
│   │   ├── router.py        # /auth/* endpoints
│   │   ├── service.py       # Login, register, tokens, reset
│   │   └── seed.py          # Roles & permissions bootstrap
│   ├── core/
│   │   ├── config.py
│   │   ├── security.py      # JWT, password hashing
│   │   ├── exceptions.py
│   │   ├── logging.py
│   │   └── container.py
│   ├── database/
│   │   ├── base.py
│   │   ├── mixins.py        # Timestamps, soft delete, tenant
│   │   └── session.py
│   ├── models/              # SQLAlchemy ORM
│   ├── entities/            # Domain entities
│   ├── repositories/
│   ├── services/
│   │   └── email_service.py # Pluggable email (dev = log)
│   ├── schemas/             # Pydantic DTOs
│   ├── mappers/
│   ├── middleware/
│   ├── analytics/           # Insights, what-if, advanced analytics
│   ├── datasets/            # Upload, intelligence, quality
│   ├── dashboards/          # Studio, auto-generator, executive
│   ├── ml/
│   ├── reports/
│   ├── notifications/
│   ├── audit/
│   ├── assistant/
│   └── utils/
├── tests/
├── requirements.txt
├── pyproject.toml
└── .env.example
```

## Frontend (`frontend/src/`)

```
src/
├── app/                     # App-level providers (optional)
├── assets/
├── routes/
│   ├── index.tsx
│   ├── paths.ts
│   ├── ProtectedRoute.tsx
│   └── PublicRoute.tsx
├── layouts/                 # (via components/layout/)
├── pages/                   # Cross-feature pages
├── components/
│   ├── ui/                  # Button, loaders, …
│   ├── layout/              # AppShell, Sidebar, AuthLayout
│   └── common/              # Error boundaries
├── features/
│   ├── auth/
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── store/
│   │   └── types/
│   ├── datasets/
│   ├── data-quality/
│   ├── analytics/
│   ├── dashboards/
│   ├── visualizations/
│   ├── ml/
│   ├── assistant/
│   ├── reports/
│   ├── notifications/
│   ├── goals/
│   ├── users/
│   └── audit/
├── services/api/            # Axios + React Query client
├── hooks/
├── store/
├── types/
├── utils/
├── constants/
├── providers/
└── styles/
```

## Documentation (`docs/`)

| File | Contents |
|------|----------|
| `SYSTEM_DESIGN.md` | HLD, module map, tech stack |
| `DETAILED_ARCHITECTURE.md` | Layers, sequences, security |
| `DATABASE_DESIGN.md` | ER diagram, tables, indexes |
| `FOLDER_STRUCTURE.md` | This file |
| `BACKEND_ARCHITECTURE.md` | Backend layer guide |
| `FRONTEND_ARCHITECTURE.md` | Frontend layer guide |
| `IMPLEMENTATION_ROADMAP.md` | Phased delivery plan |
| `AUTH_MODULE.md` | Auth API & RBAC reference |
