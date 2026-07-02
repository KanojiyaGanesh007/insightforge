# InsightForge AI — Implementation Phase Roadmap

Enterprise SaaS platform for dataset intelligence, AI insights, visualization, and analytics.

---

## Phase 0: Foundation ✅

**Goal:** Runnable API with clean architecture skeleton.

| Deliverable | Status |
|-------------|--------|
| Monorepo layout (`backend/`, `frontend/`, `docs/`) | Done |
| FastAPI app shell, DI, config | Done |
| PostgreSQL + Alembic | Done |
| Structured logging, exception handlers | Done |
| Health checks (`/health`, `/ready`) | Done |

**Exit criteria:** API responds 200 on `/api/v1/health`.

---

## Phase 1: Authentication & User Management ✅ (current)

**Goal:** Secure multi-tenant-ready auth and RBAC.

| Module | Backend | Frontend |
|--------|---------|----------|
| Auth | JWT access/refresh, RBAC, register/login/refresh/logout, reset, verify | Login, register, forgot/reset, verify, profile |
| Users | Profile via `/auth/me` | Settings profile page |

**Exit criteria:** Register → login → protected `/auth/me` → refresh → logout E2E.

---

## Phase 2: Dataset Upload & Storage

**Goal:** Ingest CSV/Excel/JSON with metadata and file storage.

| Module | Scope |
|--------|-------|
| Dataset Upload | Multipart upload, validation, local storage |
| Datasets domain | Dataset entity, metadata |

**Dependencies:** Phase 1  
**Exit criteria:** Upload file → metadata persisted → list datasets.

---

## Phase 3: Dataset Intelligence & Data Quality

**Goal:** Automated profiling and quality scoring (in-process, no job queue).

| Module | Scope |
|--------|-------|
| Dataset Intelligence Engine | Column stats, type detection, classification |
| Data Quality Center | Completeness, consistency, accuracy scores |

**Dependencies:** Phase 2  
**Exit criteria:** Post-upload analysis → quality report API.

---

## Phase 4: AI Insight Engine & Analytics Assistant

**Goal:** Rule-based insights today; LLM provider interface for future OpenAI.

**Dependencies:** Phase 3  
**Exit criteria:** Insights API; assistant chat with dataset context.

---

## Phase 5: Visualization Studio & Auto Dashboard

**Dependencies:** Phase 3  
**Exit criteria:** Save chart → render on dashboard; auto-generate dashboard JSON.

---

## Phase 6: Machine Learning Center

**Dependencies:** Phase 2–3  
**Exit criteria:** Train/predict endpoints with scikit-learn pipelines.

---

## Phase 7: Reports, Notifications & Goals

**Dependencies:** Phases 4–6  
**Exit criteria:** PDF/Excel export; in-app notifications; goal progress.

---

## Phase 8: Audit Logs & Enterprise Hardening

**Dependencies:** All prior phases  
**Exit criteria:** Audit query API; rate limiting; security checklist.

---

## Phase 9: Frontend Feature Parity

Incremental UI per backend phase.

---

## Technology Alignment

| Concern | Choice |
|---------|--------|
| API | FastAPI + Pydantic v2 |
| ORM | SQLAlchemy 2.0 async |
| Migrations | Alembic |
| Auth | JWT (access + refresh) + RBAC |
| Analytics | Pandas, NumPy, scikit-learn |
| Frontend | React + Vite + TS |

**Explicitly out of scope for initial delivery:** Docker Compose bundles, Redis, Celery, AWS deployment runbooks (add when needed).
