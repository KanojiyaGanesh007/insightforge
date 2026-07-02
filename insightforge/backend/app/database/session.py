"""Async database session management."""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings

import os
from sqlalchemy.pool import NullPool

engine_options = {
    "echo": settings.DEBUG,
}

if os.environ.get("TESTING") == "true":
    engine_options["poolclass"] = NullPool
else:
    engine_options["pool_pre_ping"] = True
    engine_options["pool_size"] = 10
    engine_options["max_overflow"] = 20

engine = create_async_engine(
    settings.DATABASE_URL,
    **engine_options
)

async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Yield a database session per request."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
