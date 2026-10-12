"""Test setup: a real Postgres test database (not SQLite), so CHECK constraints
and ON DELETE SET NULL behave exactly as in production. Tables are recreated
for every test, so tests never depend on each other."""
import os

import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url
from sqlalchemy.orm import sessionmaker

os.environ["ADMIN_API_KEY"] = "test-key"  # must be set before the app imports settings

from fastapi.testclient import TestClient  # noqa: E402

from app.config import Settings  # noqa: E402
from app.database import Base, get_db  # noqa: E402
from app.main import app  # noqa: E402

TEST_URL = Settings(
    database_url=os.getenv(
        "TEST_DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/whitelotus_test"
    )
).sqlalchemy_url


def _ensure_database_exists(url: str) -> None:
    db_name = make_url(url).database
    admin = create_engine(make_url(url).set(database="postgres"), isolation_level="AUTOCOMMIT")
    with admin.connect() as conn:
        exists = conn.execute(text("SELECT 1 FROM pg_database WHERE datname = :n"), {"n": db_name}).scalar()
        if not exists:
            conn.execute(text(f'CREATE DATABASE "{db_name}"'))
    admin.dispose()


_ensure_database_exists(TEST_URL)
engine = create_engine(TEST_URL)
TestingSession = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


@pytest.fixture()
def client():
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)

    def _get_test_db():
        db = TestingSession()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = _get_test_db
    yield TestClient(app)
    app.dependency_overrides.clear()


ADMIN = {"X-Admin-Key": "test-key"}


def make_property(**overrides) -> dict:
    data = {
        "name": "Lotus Villa",
        "location": "Whitefield",
        "price": 45_000_000,
        "size_sqft": 4200,
        "bedrooms": 4,
        "bathrooms": 5,
        "description": "A quiet villa overlooking the lake.",
        "image_url": "https://example.com/villa.jpg",
    }
    data.update(overrides)
    return data
