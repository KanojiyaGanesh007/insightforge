"""User domain entity."""

from dataclasses import dataclass, field
from datetime import datetime
from uuid import UUID


@dataclass
class UserEntity:
    """User business object (no persistence concerns)."""

    id: UUID
    email: str
    full_name: str
    is_active: bool
    is_superuser: bool
    email_verified: bool
    roles: list[str] = field(default_factory=list)
    permissions: list[str] = field(default_factory=list)
    created_at: datetime | None = None
    updated_at: datetime | None = None

    def has_role(self, *role_names: str) -> bool:
        if self.is_superuser:
            return True
        return any(name in self.roles for name in role_names)

    def has_permission(self, code: str) -> bool:
        if self.is_superuser:
            return True
        return code in self.permissions
