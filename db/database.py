"""Inherited database access with project-local configuration and read-only inspection."""
import os
from contextlib import contextmanager

from sqlalchemy import create_engine, text
from sqlalchemy.engine import URL, make_url

from utils.settings import env_bool


def build_database_url() -> URL:
    configured = os.getenv('DATABASE_URL', '').strip()
    if configured:
        url = make_url(configured)
        if url.drivername in {'postgres', 'postgresql'}:
            url = url.set(drivername='postgresql+psycopg2')
        if url.drivername != 'postgresql+psycopg2':
            raise ValueError('Use a postgresql:// or postgresql+psycopg2:// DATABASE_URL.')
        return url
    query = {}
    if os.getenv('DB_SSLMODE', '').strip():
        query['sslmode'] = os.environ['DB_SSLMODE'].strip()
    return URL.create(
        'postgresql+psycopg2',
        username=os.getenv('DB_USER', 'postgres'),
        password=os.getenv('DB_PASSWORD', ''),
        host=os.getenv('DB_HOST', '127.0.0.1'),
        port=int(os.getenv('DB_PORT', '5432')),
        database=os.getenv('DB_NAME', 'oral_cancer_rag'),
        query=query,
    )


DB_URL = build_database_url()
engine = create_engine(
    DB_URL,
    pool_pre_ping=True,
    connect_args={'connect_timeout': int(os.getenv('DB_CONNECT_TIMEOUT_SECONDS', '5'))},
)


def require_db_writes() -> None:
    if env_bool('DB_READ_ONLY', True):
        raise RuntimeError(
            'Database writes are disabled. Set DB_READ_ONLY=false in Oral-lens/.env '
            'only when you intend to initialize or add data.'
        )


@contextmanager
def get_db(*, read_only: bool | None = None):
    """Inspection callers always force read_only=True, regardless of ingestion settings."""
    readonly = env_bool('DB_READ_ONLY', True) or read_only is True
    with engine.connect() as connection:
        try:
            if readonly:
                connection.execute(text('SET TRANSACTION READ ONLY'))
            yield connection
            if readonly:
                connection.rollback()
            else:
                connection.commit()
        except Exception:
            connection.rollback()
            raise


if __name__ == '__main__':
    from scripts.inspect_db import main
    raise SystemExit(main(['status']))
