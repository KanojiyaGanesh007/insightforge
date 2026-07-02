"""Pluggable email delivery — logs in development."""

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class EmailService:
    async def send_password_reset(self, email: str, reset_url: str) -> None:
        if settings.ENVIRONMENT == "development":
            logger.info("password_reset_email", email=email, reset_url=reset_url)
            return
        # Production: integrate SMTP or transactional provider
        logger.info("password_reset_email_queued", email=email)

    async def send_email_verification(self, email: str, verify_url: str) -> None:
        if settings.ENVIRONMENT == "development":
            logger.info("email_verification", email=email, verify_url=verify_url)
            return
        logger.info("email_verification_queued", email=email)
