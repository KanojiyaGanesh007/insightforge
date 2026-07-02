# InsightForge AI — Frontend Architecture

## Layer Model (Feature-Based)

```
┌─────────────────────────────────────────────────────────┐
│  Presentation — pages/, components/, routes/          │
├─────────────────────────────────────────────────────────┤
│  Features — self-contained modules (auth, datasets…)  │
│    ├── pages/      Route-level UI                       │
│    ├── components/ Feature-specific UI                │
│    ├── hooks/      React Query + local hooks          │
│    ├── api/        Feature API calls (uses services)  │
│    ├── store/      Feature Zustand slice (optional)   │
│    └── types/      Feature domain types               │
├─────────────────────────────────────────────────────────┤
│  Data — services/ (Axios client, interceptors)          │
├─────────────────────────────────────────────────────────┤
│  Domain — types/ (shared contracts, API shapes)         │
└─────────────────────────────────────────────────────────┘
```

## Top-Level `src/` Folders

| Folder | Purpose |
|--------|---------|
| **features/** | Business capabilities; each feature owns UI + hooks + API |
| **components/** | Shared UI: layout, design system, ErrorBoundary |
| **pages/** | Cross-feature pages (home, 404) |
| **routes/** | Router config, path constants, ProtectedRoute |
| **hooks/** | Global reusable hooks |
| **store/** | Global Zustand stores (auth re-export, app UI state) |
| **services/** | Axios instance, React Query client, interceptors |
| **types/** | Shared TypeScript types and API envelopes |

## Data Flow

```
Page → feature hook (useQuery/useMutation) → feature api → services/apiClient → Backend
                ↓
         Zustand (auth tokens, UI prefs)
```

## Auth & Protected Routes

- Tokens in `features/auth/store/authStore.ts` (Zustand + persist)
- Axios request interceptor attaches `Authorization: Bearer`
- `ProtectedRoute` redirects unauthenticated users to `/login`

## Error Handling

- `AppErrorBoundary` wraps the router (fatal render errors)
- `FeatureErrorBoundary` optional per feature section
- Axios response interceptor maps API errors to typed `ApiError`
