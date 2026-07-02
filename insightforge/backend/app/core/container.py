"""Dependency injection container — register services and repositories."""

from functools import lru_cache

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.base import BaseRepository


class Container:
    """Simple DI container for application dependencies."""

    def __init__(self) -> None:
        self._registry: dict[type, object] = {}

    def register(self, interface: type, implementation: object) -> None:
        self._registry[interface] = implementation

    def resolve(self, interface: type):
        if interface not in self._registry:
            raise KeyError(f"No binding for {interface}")
        return self._registry[interface]


@lru_cache
def get_container() -> Container:
    return Container()


def get_repository(repo_class: type[BaseRepository], session: AsyncSession) -> BaseRepository:
    """Factory for repository instances bound to a DB session."""
    return repo_class(session)
