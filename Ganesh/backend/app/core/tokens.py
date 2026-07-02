"""Secure opaque token generation and hashing."""

import hashlib
import secrets


def generate_opaque_token() -> str:
    """URL-safe random token for email links and refresh storage."""
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()
