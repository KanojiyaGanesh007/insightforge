"""User mapping between layers."""

from app.entities.user import UserEntity
from app.models.user import User
from app.schemas.auth import UserProfileResponse
from app.schemas.user import UserResponse


class UserMapper:
    @staticmethod
    def model_to_entity(model: User) -> UserEntity:
        role_names = [r.name for r in model.roles] if model.roles else []
        permission_codes: list[str] = []
        for role in model.roles:
            for perm in role.permissions:
                if perm.code not in permission_codes:
                    permission_codes.append(perm.code)

        return UserEntity(
            id=model.id,
            email=model.email,
            full_name=model.full_name,
            is_active=model.is_active,
            is_superuser=model.is_superuser,
            email_verified=model.email_verified_at is not None,
            roles=role_names,
            permissions=permission_codes,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )

    @staticmethod
    def entity_to_response(entity: UserEntity) -> UserResponse:
        return UserResponse(
            id=entity.id,
            email=entity.email,
            full_name=entity.full_name,
            is_active=entity.is_active,
            is_superuser=entity.is_superuser,
            created_at=entity.created_at,  # type: ignore[arg-type]
            updated_at=entity.updated_at,  # type: ignore[arg-type]
        )

    @staticmethod
    def entity_to_profile(entity: UserEntity) -> UserProfileResponse:
        base = UserMapper.entity_to_response(entity)
        return UserProfileResponse(
            **base.model_dump(),
            roles=entity.roles,
            email_verified=entity.email_verified,
        )
