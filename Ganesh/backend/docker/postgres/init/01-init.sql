-- InsightForge AI — PostgreSQL initialization
-- Runs once on first container start (empty data volume).

-- Extensions for UUID and full-text search (future)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Application schema namespace (optional separation)
CREATE SCHEMA IF NOT EXISTS insightforge;
COMMENT ON SCHEMA insightforge IS 'InsightForge AI application objects';

-- Grant privileges to application user (created by POSTGRES_USER env)
GRANT ALL ON SCHEMA insightforge TO CURRENT_USER;
GRANT ALL ON SCHEMA public TO CURRENT_USER;

-- Default search path
ALTER DATABASE insightforge_db SET search_path TO public, insightforge;
