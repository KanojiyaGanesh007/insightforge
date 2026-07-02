# InsightForge AI — Frontend

React + TypeScript + Vite feature-based architecture.

## Stack

- React 18 · TypeScript · Vite
- React Router · TanStack React Query
- Axios · Zustand · TailwindCSS

## Structure

```
src/
├── features/       # Business modules (auth, datasets, …)
├── components/     # Shared UI, layout, ErrorBoundary
├── pages/          # Cross-feature pages
├── routes/         # Router, ProtectedRoute, paths
├── hooks/          # Global hooks
├── store/          # Global Zustand stores
├── services/       # Axios client, React Query config
└── types/          # Shared TypeScript types
```

See [docs/FRONTEND_ARCHITECTURE.md](../docs/FRONTEND_ARCHITECTURE.md).

## Quick Start

```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:5173 (proxies `/api` → backend :8000)

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript check |
