"""Shared dependencies for dependency injection."""

from typing import Generator

from sqlalchemy.orm import Session

from app.core.database import SessionLocal


def get_db() -> Generator[Session, None, None]:
    """Yield a database session, auto-closing on exit."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
