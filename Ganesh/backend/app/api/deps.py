"""FastAPI dependency injection helpers."""

from collections.abc import Callable
from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.service import AuthService
from app.core.security import decode_token
from app.database.session import get_db
from app.entities.user import UserEntity
from app.datasets.service import DatasetService

security_scheme = HTTPBearer(auto_error=False)

DbSession = Annotated[AsyncSession, Depends(get_db)]


async def get_auth_service(session: DbSession) -> AuthService:
    return AuthService(session)


AuthServiceDep = Annotated[AuthService, Depends(get_auth_service)]


async def get_dataset_service(session: DbSession) -> DatasetService:
    return DatasetService(session)


DatasetServiceDep = Annotated[DatasetService, Depends(get_dataset_service)]



async def get_current_user_id(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security_scheme)],
) -> UUID:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = decode_token(credentials.credentials)
        if payload.get("type") != "access":
            raise ValueError("Invalid token type")
        sub = payload.get("sub")
        if not sub:
            raise ValueError("Missing subject")
        return UUID(str(sub))
    except (ValueError, TypeError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc


CurrentUserId = Annotated[UUID, Depends(get_current_user_id)]


async def get_current_user(
    user_id: CurrentUserId,
    auth: AuthServiceDep,
) -> UserEntity:
    try:
        entity = await auth.get_profile(user_id)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        ) from exc
    if not entity.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled")
    return entity


CurrentUser = Annotated[UserEntity, Depends(get_current_user)]


def require_roles(*role_names: str) -> Callable:
    """Dependency factory: user must have at least one of the given roles."""

    async def checker(user: CurrentUser) -> UserEntity:
        if not user.has_role(*role_names):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient role privileges",
            )
        return user

    return checker


def require_permission(permission_code: str) -> Callable:
    """Dependency factory: user must have the given permission."""

    async def checker(user: CurrentUser) -> UserEntity:
        if not user.has_permission(permission_code):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return user

    return checker
