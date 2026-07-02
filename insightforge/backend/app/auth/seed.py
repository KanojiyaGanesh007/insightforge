"""Bootstrap roles and permissions."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.models.role import Permission, Role

logger = get_logger(__name__)

ROLE_NAMES = ("admin", "analyst", "manager", "executive")

PERMISSIONS: list[tuple[str, str, str, str]] = [
    ("users:read", "users", "read", "View users"),
    ("users:write", "users", "write", "Update users"),
    ("users:admin", "users", "admin", "Administer users"),
    ("datasets:read", "datasets", "read", "View datasets"),
    ("datasets:write", "datasets", "write", "Upload and update datasets"),
    ("datasets:delete", "datasets", "delete", "Delete datasets"),
    ("dashboards:read", "dashboards", "read", "View dashboards"),
    ("dashboards:write", "dashboards", "write", "Edit dashboards"),
    ("insights:read", "insights", "read", "View insights"),
    ("insights:generate", "insights", "generate", "Generate insights"),
    ("ml:train", "ml", "train", "Train ML models"),
    ("ml:predict", "ml", "predict", "Run predictions"),
    ("reports:read", "reports", "read", "View reports"),
    ("reports:generate", "reports", "generate", "Generate reports"),
    ("audit:read", "audit", "read", "View audit logs"),
    ("goals:manage", "goals", "manage", "Manage goals"),
    ("settings:manage", "settings", "manage", "Manage account settings"),
]

ROLE_PERMISSION_MAP: dict[str, list[str]] = {
    "admin": [p[0] for p in PERMISSIONS],
    "analyst": [
        "datasets:read",
        "datasets:write",
        "datasets:delete",
        "dashboards:read",
        "dashboards:write",
        "insights:read",
        "insights:generate",
        "ml:train",
        "ml:predict",
        "reports:read",
        "reports:generate",
        "goals:manage",
        "settings:manage",
    ],
    "manager": [
        "users:read",
        "datasets:read",
        "datasets:write",
        "dashboards:read",
        "dashboards:write",
        "insights:read",
        "insights:generate",
        "ml:predict",
        "reports:read",
        "reports:generate",
        "goals:manage",
        "settings:manage",
    ],
    "executive": [
        "users:read",
        "datasets:read",
        "dashboards:read",
        "insights:read",
        "ml:predict",
        "reports:read",
        "reports:generate",
        "audit:read",
        "goals:manage",
        "settings:manage",
    ],
}


async def seed_roles_and_permissions(session: AsyncSession) -> None:
    """Idempotent seed of RBAC data."""
    existing = await session.execute(select(Role).limit(1))
    if existing.scalar_one_or_none():
        return

    permission_by_code: dict[str, Permission] = {}
    for code, resource, action, description in PERMISSIONS:
        perm = Permission(code=code, resource=resource, action=action, description=description)
        session.add(perm)
        permission_by_code[code] = perm
    await session.flush()

    for role_name in ROLE_NAMES:
        role = Role(
            name=role_name,
            description=f"Built-in {role_name} role",
        )
        for code in ROLE_PERMISSION_MAP[role_name]:
            role.permissions.append(permission_by_code[code])
        session.add(role)

    await session.commit()
    logger.info("rbac_seed_completed", roles=list(ROLE_NAMES))
