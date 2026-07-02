"""Authentication and session management service."""

from datetime import UTC, datetime, timedelta
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import ConflictError, UnauthorizedError
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.core.tokens import generate_opaque_token, hash_token
from app.entities.user import UserEntity
from app.mappers.user_mapper import UserMapper
from app.models.token import EmailVerificationToken, PasswordResetToken, RefreshToken
from app.models.user import User
from app.repositories.role_repository import RoleRepository
from app.repositories.token_repository import (
    EmailVerificationTokenRepository,
    PasswordResetTokenRepository,
    RefreshTokenRepository,
)
from app.repositories.user_repository import UserRepository
from app.schemas.auth import (
    AuthResponse,
    LoginRequest,
    ProfileUpdateRequest,
    RegisterRequest,
    TokenResponse,
)
from app.services.email_service import EmailService


class AuthService:
    def __init__(
        self,
        session: AsyncSession,
        email_service: EmailService | None = None,
    ) -> None:
        self.session = session
        self.user_repo = UserRepository(session)
        self.role_repo = RoleRepository(session)
        self.refresh_repo = RefreshTokenRepository(session)
        self.reset_repo = PasswordResetTokenRepository(session)
        self.verify_repo = EmailVerificationTokenRepository(session)
        self.email_service = email_service or EmailService()

    async def register(self, data: RegisterRequest) -> AuthResponse:
        if await self.user_repo.exists_by_email(data.email):
            raise ConflictError("Email already registered")

        analyst_role = await self.role_repo.get_by_name("analyst")
        user = User(
            email=data.email.lower(),
            hashed_password=hash_password(data.password),
            full_name=data.full_name,
        )
        if analyst_role:
            user.roles.append(analyst_role)

        created = await self.user_repo.add(user)
        await self.session.commit()
        await self.session.refresh(created, attribute_names=["roles"])

        entity = await self._load_entity(created.id)
        await self._send_verification_email(entity)
        return await self._issue_tokens(entity)

    async def login(self, data: LoginRequest) -> AuthResponse:
        user = await self.user_repo.get_by_email(data.email.lower())
        if not user or not verify_password(data.password, user.hashed_password):
            raise UnauthorizedError("Invalid email or password")
        if not user.is_active:
            raise UnauthorizedError("Account is disabled")

        entity = await self._load_entity(user.id)
        return await self._issue_tokens(entity)

    async def refresh(self, refresh_token: str) -> AuthResponse:
        payload = self._decode_refresh(refresh_token)
        user_id = UUID(payload["sub"])
        token_hash = hash_token(refresh_token)

        stored = await self.refresh_repo.get_by_hash(token_hash)
        if not stored or stored.revoked_at is not None:
            raise UnauthorizedError("Invalid refresh token")
        if stored.expires_at < datetime.now(UTC):
            raise UnauthorizedError("Refresh token expired")

        entity = await self._load_entity(user_id)
        if not entity.is_active:
            raise UnauthorizedError("Account is disabled")

        stored.revoked_at = datetime.now(UTC)
        await self.session.flush()
        return await self._issue_tokens(entity)

    async def logout(self, user_id: UUID, refresh_token: str) -> None:
        token_hash = hash_token(refresh_token)
        stored = await self.refresh_repo.get_by_hash(token_hash)
        if stored and stored.user_id == user_id:
            stored.revoked_at = datetime.now(UTC)
            await self.session.commit()

    async def forgot_password(self, email: str) -> None:
        user = await self.user_repo.get_by_email(email.lower())
        if not user:
            return

        raw_token = generate_opaque_token()
        reset = PasswordResetToken(
            user_id=user.id,
            token_hash=hash_token(raw_token),
            expires_at=datetime.now(UTC) + timedelta(hours=settings.PASSWORD_RESET_EXPIRE_HOURS),
            created_at=datetime.now(UTC),
        )
        await self.reset_repo.add(reset)
        await self.session.commit()

        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={raw_token}"
        await self.email_service.send_password_reset(user.email, reset_url)

    async def reset_password(self, token: str, new_password: str) -> None:
        stored = await self.reset_repo.get_valid_by_hash(hash_token(token))
        if not stored:
            raise UnauthorizedError("Invalid or expired reset token")

        user = await self.user_repo.get_by_id(stored.user_id)
        if not user:
            raise UnauthorizedError("User not found")

        user.hashed_password = hash_password(new_password)
        stored.used_at = datetime.now(UTC)
        await self.refresh_repo.revoke_for_user(user.id)
        await self.session.commit()

    async def verify_email(self, token: str) -> None:
        stored = await self.verify_repo.get_valid_by_hash(hash_token(token))
        if not stored:
            raise UnauthorizedError("Invalid or expired verification token")

        user = await self.user_repo.get_by_id(stored.user_id)
        if not user:
            raise UnauthorizedError("User not found")

        user.email_verified_at = datetime.now(UTC)
        stored.used_at = datetime.now(UTC)
        await self.session.commit()

    async def resend_verification(self, user_id: UUID) -> None:
        entity = await self._load_entity(user_id)
        if entity.email_verified:
            return
        await self._send_verification_email(entity)

    async def get_profile(self, user_id: UUID) -> UserEntity:
        return await self._load_entity(user_id)

    async def update_profile(self, user_id: UUID, data: ProfileUpdateRequest) -> UserEntity:
        user = await self.user_repo.get_by_id_active(user_id)
        if not user:
            raise UnauthorizedError("User not found")

        if data.new_password:
            if not data.current_password or not verify_password(
                data.current_password, user.hashed_password
            ):
                raise UnauthorizedError("Current password is incorrect")
            user.hashed_password = hash_password(data.new_password)

        if data.full_name is not None:
            user.full_name = data.full_name

        await self.session.commit()
        return await self._load_entity(user_id)

    async def _load_entity(self, user_id: UUID) -> UserEntity:
        user = await self.user_repo.get_by_id_active(user_id)
        if not user:
            raise UnauthorizedError("User not found")
        return UserMapper.model_to_entity(user)

    async def _issue_tokens(self, entity: UserEntity) -> AuthResponse:
        extra = {"roles": entity.roles}
        access = create_access_token(entity.id, extra_claims=extra)
        refresh = create_refresh_token(entity.id)

        expires_at = datetime.now(UTC) + timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS)
        row = RefreshToken(
            user_id=entity.id,
            token_hash=hash_token(refresh),
            expires_at=expires_at,
        )
        await self.refresh_repo.add(row)
        await self.session.commit()

        user_response = UserMapper.entity_to_response(entity)
        return AuthResponse(
            access_token=access,
            refresh_token=refresh,
            user=user_response,
        )

    async def _send_verification_email(self, entity: UserEntity) -> None:
        raw_token = generate_opaque_token()
        row = EmailVerificationToken(
            user_id=entity.id,
            token_hash=hash_token(raw_token),
            expires_at=datetime.now(UTC) + timedelta(hours=settings.EMAIL_VERIFICATION_EXPIRE_HOURS),
            created_at=datetime.now(UTC),
        )
        await self.verify_repo.add(row)
        await self.session.commit()

        verify_url = f"{settings.FRONTEND_URL}/verify-email?token={raw_token}"
        await self.email_service.send_email_verification(entity.email, verify_url)

    @staticmethod
    def _decode_refresh(token: str) -> dict:
        try:
            payload = decode_token(token)
        except ValueError as exc:
            raise UnauthorizedError("Invalid refresh token") from exc
        if payload.get("type") != "refresh":
            raise UnauthorizedError("Invalid token type")
        return payload

    @staticmethod
    def build_token_response(access: str, refresh: str) -> TokenResponse:
        return TokenResponse(access_token=access, refresh_token=refresh)
