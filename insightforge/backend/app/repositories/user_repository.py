"""User repository."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.role import Role
from app.models.user import User
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    model = User

    async def get_by_email(self, email: str, *, include_deleted: bool = False) -> User | None:
        stmt = select(User).where(User.email == email)
        if not include_deleted:
            stmt = stmt.where(User.deleted_at.is_(None))
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_id_active(self, user_id: UUID) -> User | None:
        result = await self.session.execute(
            select(User)
            .where(User.id == user_id, User.deleted_at.is_(None))
            .options(selectinload(User.roles).selectinload(Role.permissions))
        )
        return result.scalar_one_or_none()

    async def exists_by_email(self, email: str) -> bool:
        user = await self.get_by_email(email)
        return user is not None
