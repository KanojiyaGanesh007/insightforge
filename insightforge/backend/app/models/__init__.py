"""SQLAlchemy ORM models — import all for Alembic metadata."""

from app.models.associations import role_permissions, user_roles  # noqa: F401
from app.models.dataset import Dataset, DatasetMetadata  # noqa: F401
from app.models.role import Permission, Role  # noqa: F401
from app.models.token import EmailVerificationToken, PasswordResetToken, RefreshToken  # noqa: F401
from app.models.user import User  # noqa: F401
from app.models.assistant import Conversation, ConversationMessage  # noqa: F401
from app.models.dashboard import Dashboard, DashboardWidget  # noqa: F401

__all__ = [
    "User",
    "Role",
    "Permission",
    "user_roles",
    "role_permissions",
    "RefreshToken",
    "PasswordResetToken",
    "EmailVerificationToken",
    "Dataset",
    "DatasetMetadata",
    "Conversation",
    "ConversationMessage",
    "Dashboard",
    "DashboardWidget",
]

