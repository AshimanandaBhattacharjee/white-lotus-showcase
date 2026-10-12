"""Shared dependencies."""
import secrets

from fastapi import Header, HTTPException, status

from app.config import settings


def require_admin(x_admin_key: str | None = Header(default=None)) -> None:
    """Guard for sales-team-only endpoints.

    A single shared key sent as the X-Admin-Key header. Deliberately simple for
    an internal tool built in 24h; real user accounts (and per-user audit) are
    listed under "next steps" in the README. compare_digest avoids leaking the
    key through response-timing differences.
    """
    if not x_admin_key or not secrets.compare_digest(x_admin_key, settings.admin_api_key):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid admin key")
