"""User management service."""

from uuid import UUID

from app.core.exceptions import ConflictError, NotFoundError
from app.core.security import hash_password
from app.entities.user import UserEntity
from app.mappers.user_mapper import UserMapper
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserCreate, UserUpdate


class UserService:
    def __init__(self, user_repo: UserRepository) -> None:
        self.user_repo = user_repo

    async def create_user(self, data: UserCreate) -> UserEntity:
        if await self.user_repo.exists_by_email(data.email):
            raise ConflictError("Email already registered")
        user = User(
            email=data.email.lower(),
            hashed_password=hash_password(data.password),
            full_name=data.full_name,
        )
        created = await self.user_repo.add(user)
        return UserMapper.model_to_entity(created)

    async def get_user(self, user_id: UUID) -> UserEntity:
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        return UserMapper.model_to_entity(user)

    async def update_user(self, user_id: UUID, data: UserUpdate) -> UserEntity:
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        if data.full_name is not None:
            user.full_name = data.full_name
        if data.is_active is not None:
            user.is_active = data.is_active
        await self.user_repo.session.flush()
        await self.user_repo.session.refresh(user)
        return UserMapper.model_to_entity(user)
