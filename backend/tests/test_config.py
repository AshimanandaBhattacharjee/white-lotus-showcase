from app.config import Settings


def test_database_url_is_normalised_for_psycopg():
    # Render/Heroku-style URLs must work without editing.
    assert Settings(database_url="postgres://u:p@h/db").sqlalchemy_url == "postgresql+psycopg://u:p@h/db"
    assert Settings(database_url="postgresql://u:p@h/db").sqlalchemy_url == "postgresql+psycopg://u:p@h/db"


def test_cors_origins_split_and_trimmed():
    s = Settings(cors_origins="https://a.app, https://b.app ,")
    assert s.cors_origin_list == ["https://a.app", "https://b.app"]
