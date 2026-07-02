# Authentication & Authorization Module

## Endpoints (`/api/v1/auth`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | Public | Create account, assign default `analyst` role |
| POST | `/login` | Public | Issue access + refresh tokens |
| POST | `/refresh` | Public | Rotate refresh token |
| POST | `/logout` | Bearer | Revoke refresh token |
| POST | `/forgot-password` | Public | Send reset link (always 204) |
| POST | `/reset-password` | Public | Set new password with token |
| POST | `/verify-email` | Public | Verify email with token |
| POST | `/resend-verification` | Bearer | Resend verification email |
| GET | `/me` | Bearer | Current user profile + roles |
| PATCH | `/me` | Bearer | Update profile (name, password) |

## Token Strategy

- **Access token:** JWT, 30 min default, `type: access`, claims: `sub`, `roles[]`
- **Refresh token:** JWT, 7 days default, stored as SHA-256 hash in `refresh_tokens`
- **Logout:** Revokes matching refresh token row
- **Rotation:** Refresh invalidates old row and issues new pair

## Default Roles

| Role | Typical user |
|------|----------------|
| `admin` | Platform administrator |
| `analyst` | Data analyst (default on register) |
| `manager` | Team lead |
| `executive` | Read-heavy executive dashboards |

## FastAPI Dependencies

```python
CurrentUser      # UserEntity + roles
CurrentUserId    # UUID string from JWT
require_roles("admin")
require_permission("datasets:write")
```

## Frontend Routes

| Path | Screen |
|------|--------|
| `/login` | Login |
| `/register` | Register |
| `/forgot-password` | Request reset |
| `/reset-password?token=` | New password |
| `/verify-email?token=` | Email confirmation |
| `/settings/profile` | Profile management |

## Email (Development)

`EmailService` logs reset/verification URLs when `ENVIRONMENT=development`.

Configure SMTP in `.env` for production (future `SMTP_*` settings).
