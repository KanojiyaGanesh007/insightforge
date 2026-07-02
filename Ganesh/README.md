# InsightForge AI

Enterprise-grade SaaS for dataset intelligence, AI insights, visualization, and analytics.

## Repository Structure

```
InsightForge/
├── backend/          # FastAPI (Phase 0 complete)
├── frontend/         # React + Vite (architecture scaffold)
└── docs/             # Architecture & roadmap
```

## Getting Started

```bash
cd backend
docker compose up -d
```

- Health: http://localhost:8000/api/v1/health
- Docs: http://localhost:8000/docs

## Frontend

```bash
cd frontend && npm install && npm run dev
```

## Documentation

- [Implementation Roadmap](docs/IMPLEMENTATION_ROADMAP.md)
- [Backend Architecture](docs/BACKEND_ARCHITECTURE.md)
- [Frontend Architecture](docs/FRONTEND_ARCHITECTURE.md)
- [Docker Guide](docs/DOCKER.md)
