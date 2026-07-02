# InsightForge AI — Detailed System Architecture

## 1. Layered Backend Architecture

```mermaid
flowchart LR
    subgraph HTTP
        R[Routers]
        D[Dependencies]
    end
    subgraph Application
        S[Services]
        M[Mappers]
    end
    subgraph Domain
        E[Entities]
    end
    subgraph Infrastructure
        REP[Repositories]
        ORM[SQLAlchemy Models]
        DB[(PostgreSQL)]
    end

    R --> D --> S
    S --> M
    S --> REP
    M --> E
    REP --> ORM --> DB
```

### Layer Rules

| Layer | May depend on | Must not |
|-------|---------------|----------|
| **api/** | schemas, services (via Depends), deps | Import ORM models in route handlers |
| **services/** | entities, repositories, mappers, core | Return ORM models to API |
| **repositories/** | models, database session | Contain business rules |
| **entities/** | stdlib only | Know about FastAPI or SQLAlchemy |
| **schemas/** | Pydantic only | Contain logic |
| **mappers/** | entities, models, schemas | Perform I/O |

## 2. Request Lifecycle

```mermaid
sequenceDiagram
    participant C as Client
    participant M as Middleware
    participant R as Router
    participant S as Service
    participant Rep as Repository
    participant DB as PostgreSQL

    C->>M: HTTP Request + Bearer JWT
    M->>M: Correlation ID, logging
    M->>R: Forward
    R->>R: Depends: validate JWT, load user, check permission
    R->>S: Call use case (DTO in)
    S->>Rep: Query / persist
    Rep->>DB: SQL (async)
    DB-->>Rep: Rows
    Rep-->>S: ORM / None
    S-->>R: Entity → Mapper → Response DTO
    R-->>C: JSON + status
```

## 3. Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant FE as React SPA
    participant API as Auth API
    participant S as AuthService
    participant DB as PostgreSQL

    U->>FE: Register / Login
    FE->>API: POST /auth/register or /login
    API->>S: Validate credentials
    S->>DB: User + refresh token hash
    S-->>API: access + refresh JWT
    API-->>FE: tokens + user profile
    FE->>FE: Zustand persist tokens

    Note over FE,API: Subsequent requests
    FE->>API: Authorization: Bearer access
    API->>API: Decode JWT, load user + roles

    Note over FE,API: Token refresh
    FE->>API: POST /auth/refresh { refresh_token }
    API->>S: Verify refresh hash, rotate
    S-->>FE: New token pair
```

## 4. Authorization (RBAC)

```mermaid
erDiagram
    users ||--o{ user_roles : has
    roles ||--o{ user_roles : assigned
    roles ||--o{ role_permissions : grants
    permissions ||--o{ role_permissions : includes

    users {
        uuid id PK
        string email UK
        string hashed_password
    }
    roles {
        uuid id PK
        string name UK
    }
    permissions {
        uuid id PK
        string code UK
    }
```

**Roles (built-in):** `admin`, `analyst`, `manager`, `executive`

**Enforcement:**

- `get_current_user` — valid access JWT + active user
- `require_roles(*names)` — user has at least one role
- `require_permission(code)` — user’s roles include permission

## 5. Dataset Processing Pipeline (Phase 2+)

```mermaid
flowchart TD
    UP[Multipart Upload] --> VAL[File Validation]
    VAL --> PARSE[Pandas Parse]
    PARSE --> REG[Register Dataset Row]
    REG --> META[Extract Metadata JSON]
    META --> PROF[Column Profiler]
    PROF --> CLASS[Dataset Classifier]
    CLASS --> QUAL[Quality Engine]
    QUAL --> INS[Insight Engine]
    INS --> REC[Chart Recommendations]
    REC --> DASH[Auto Dashboard JSON]
```

Processing runs **in-process** on the API worker for MVP (no message broker required).

## 6. AI / LLM Integration (Future-Ready)

```mermaid
flowchart LR
    SVC[InsightService / AssistantService]
    SVC --> PORT[LLMProvider Protocol]
    PORT --> RULES[RulesEngineProvider — default]
    PORT --> OPENAI[OpenAIProvider — future]
    PORT --> MOCK[MockProvider — tests]
```

Context assembly:

1. Dataset metadata + quality summary + sample stats
2. Recent insights and KPIs
3. User question (assistant)
4. Prompt template → provider → structured JSON response

## 7. Frontend Architecture

```mermaid
flowchart TB
    subgraph Presentation
        Pages[pages/ + features/*/pages]
        Comp[components/]
    end
    subgraph Features
        F1[auth]
        F2[datasets]
        F3[dashboards]
    end
    subgraph Data
        RQ[React Query]
        AX[Axios client]
        ZS[Zustand]
    end

    Pages --> F1 & F2 & F3
    F1 --> RQ --> AX
    F1 --> ZS
    AX --> API[FastAPI /api/v1]
```

- **Route guards:** `ProtectedRoute`, `PublicRoute`
- **Token refresh:** Axios interceptor (401 → clear auth; refresh hook in Phase 1 enhancement)
- **Feature boundaries:** Each feature owns `api/`, `hooks/`, `types/`, optional `store/`

## 8. Security Architecture

| Threat | Mitigation |
|--------|------------|
| Credential theft | bcrypt hashing, short-lived access JWT, hashed refresh tokens in DB |
| Broken access control | RBAC on endpoints, user-scoped dataset queries |
| Injection | SQLAlchemy parameterized queries, Pydantic validation |
| XSS | React escaping; API returns JSON only |
| CSRF | SPA + Bearer tokens (no cookie session for API) |
| File upload abuse | Extension/MIME/size limits, virus scan hook (future) |
| Abuse / DoS | Rate-limit middleware architecture (IP sliding window stub) |

## 9. Multi-Tenancy (Future)

- Add `organizations` table
- Set `organization_id` on `users`, `datasets`, `dashboards`, …
- Repository base filter: `WHERE organization_id = :tenant`
- JWT claim: `org_id` for tenant context

## 10. API Versioning

- Prefix: `/api/v1`
- Breaking changes → `/api/v2`
- OpenAPI at `/docs` (development only)
