"""Role repository."""

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.role import Role
from app.repositories.base import BaseRepository


class RoleRepository(BaseRepository[Role]):
    model = Role

    async def get_by_name(self, name: str) -> Role | None:
        result = await self.session.execute(select(Role).where(Role.name == name))
        return result.scalar_one_or_none()

    async def list_all_with_permissions(self) -> list[Role]:
        result = await self.session.execute(
            select(Role).options(selectinload(Role.permissions))
        )
        return list(result.scalars().all())
