# InsightForge AI — Docker Environment

## Containers

|Service|Image|Port|Purpose|
|-|-|-|-|
|**api**|Custom (`Dockerfile.dev`)|8000|FastAPI application|
|**postgres**|`postgres:16-alpine`|5432|Primary database|
|**redis**|`redis:7-alpine`|6379|Cache, Celery broker|

## Networks

* **insightforge-net** (bridge): All services communicate on this internal network.
* Host access via published ports only (`API\_PORT`, `POSTGRES\_PORT`, `REDIS\_PORT`).

## Volumes

|Volume|Mount|Purpose|
|-|-|-|
|`insightforge-postgres-data`|`/var/lib/postgresql/data`|Persistent PostgreSQL data|
|`insightforge-redis-data`|`/data`|Redis AOF persistence|
|Bind: `./app` → `/app/app`|Dev hot-reload for API||

## Health Checks

|Service|Probe|Interval|
|-|-|-|
|api|`GET /api/v1/health`|30s|
|postgres|`pg\_isready`|10s|
|redis|`redis-cli ping`|10s|

Readiness (DB connected): `GET /api/v1/ready`

## Development Workflow

```bash
cd backend
cp .env.example .env   # if .env missing
docker compose up -d
docker compose logs -f api

# Run migrations (after first boot)
docker compose exec api alembic revision --autogenerate -m "initial"
docker compose exec api alembic upgrade head

# Run tests
docker compose exec api pytest -v

# Stop
docker compose down

# Reset data (destructive)
docker compose down -v
```

### Local without Docker

```bash
python -m venv .venv \&\& source .venv/bin/activate
pip install -r requirements.txt
export $(grep -v '^#' .env | xargs)
# Point POSTGRES\_HOST=localhost, REDIS\_HOST=localhost
uvicorn app.main:app --reload
```

## Production Recommendations

1. **Images**: Use `Dockerfile` (multi-stage), not `Dockerfile.dev`. Pin image digests.
2. **Secrets**: Inject via orchestrator secrets (K8s Secrets, AWS SSM)—never bake into images.
3. **JWT**: Rotate `JWT\_SECRET\_KEY`; use RS256 with key pair for multi-service auth.
4. **Database**: Managed PostgreSQL (RDS, Cloud SQL), SSL required, connection pooling (PgBouncer).
5. **Redis**: Managed Redis with AUTH, TLS in production.
6. **Compose**: Replace `docker-compose.yml` with K8s/ECS manifests; use separate compose override for prod.
7. **Scaling**: Horizontally scale API replicas; dedicated Celery worker deployment.
8. **Observability**: JSON logs, OpenTelemetry traces, Prometheus metrics on `/metrics` (add in Phase 8).
9. **Backups**: Automated Postgres snapshots; test restore runbooks.
10. **CORS**: Restrict `CORS\_ORIGINS` to production frontend domains only.
11. **DEBUG**: Set `DEBUG=false`; disable `/docs` in production (`main.py` already gates this).
12. **Resource limits**: Set CPU/memory limits on all containers in orchestrator.

## File Reference

|File|Role|
|-|-|
|`docker-compose.yml`|Service orchestration|
|`Dockerfile`|Production API image|
|`Dockerfile.dev`|Dev image with `--reload`|
|`.env`|Local secrets (gitignored)|
|`.env.example`|Template for team|
|`docker/postgres/init/01-init.sql`|DB extensions \& schema bootstrap|



