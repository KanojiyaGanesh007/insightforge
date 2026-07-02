"""Authentication API routes."""

from uuid import UUID

from fastapi import APIRouter, Depends, status
from starlette.responses import Response

from app.api.deps import CurrentUser, DbSession, get_auth_service
from app.auth.service import AuthService
from app.mappers.user_mapper import UserMapper
from app.schemas.auth import (
    AuthResponse,
    ForgotPasswordRequest,
    LoginRequest,
    LogoutRequest,
    MessageResponse,
    ProfileUpdateRequest,
    RefreshRequest,
    RegisterRequest,
    ResetPasswordRequest,
    UserProfileResponse,
    VerifyEmailRequest,
)

router = APIRouter()


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(
    body: RegisterRequest,
    auth: AuthService = Depends(get_auth_service),
) -> AuthResponse:
    return await auth.register(body)


@router.post("/login", response_model=AuthResponse)
async def login(
    body: LoginRequest,
    auth: AuthService = Depends(get_auth_service),
) -> AuthResponse:
    return await auth.login(body)


@router.post("/refresh", response_model=AuthResponse)
async def refresh(
    body: RefreshRequest,
    auth: AuthService = Depends(get_auth_service),
) -> AuthResponse:
    return await auth.refresh(body.refresh_token)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    body: LogoutRequest,
    current_user: CurrentUser,
    auth: AuthService = Depends(get_auth_service),
) -> Response:
    await auth.logout(current_user.id, body.refresh_token)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/forgot-password", status_code=status.HTTP_204_NO_CONTENT)
async def forgot_password(
    body: ForgotPasswordRequest,
    auth: AuthService = Depends(get_auth_service),
) -> Response:
    await auth.forgot_password(body.email)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(
    body: ResetPasswordRequest,
    auth: AuthService = Depends(get_auth_service),
) -> MessageResponse:
    await auth.reset_password(body.token, body.new_password)
    return MessageResponse(message="Password updated successfully")


@router.post("/verify-email", response_model=MessageResponse)
async def verify_email(
    body: VerifyEmailRequest,
    auth: AuthService = Depends(get_auth_service),
) -> MessageResponse:
    await auth.verify_email(body.token)
    return MessageResponse(message="Email verified successfully")


@router.post("/resend-verification", status_code=status.HTTP_204_NO_CONTENT)
async def resend_verification(
    current_user: CurrentUser,
    auth: AuthService = Depends(get_auth_service),
) -> Response:
    await auth.resend_verification(current_user.id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/me", response_model=UserProfileResponse)
async def get_me(current_user: CurrentUser) -> UserProfileResponse:
    return UserMapper.entity_to_profile(current_user)


@router.patch("/me", response_model=UserProfileResponse)
async def update_me(
    body: ProfileUpdateRequest,
    current_user: CurrentUser,
    auth: AuthService = Depends(get_auth_service),
) -> UserProfileResponse:
    entity = await auth.update_profile(current_user.id, body)
    return UserMapper.entity_to_profile(entity)
