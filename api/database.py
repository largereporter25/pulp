import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from dotenv import load_dotenv

load_dotenv()

# On serverless platforms (e.g. Vercel) the project dir is read-only but
# /tmp is writable. When no DATABASE_URL is provided, default SQLite there
# so cold starts don't crash. In production, set DATABASE_URL to Neon.
_default_sqlite = "sqlite+aiosqlite:///./pulp.db"
if os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME"):
    _default_sqlite = "sqlite+aiosqlite:////tmp/pulp.db"

DATABASE_URL = os.getenv("DATABASE_URL", _default_sqlite)

# Neon Postgres uses postgresql:// — remap to asyncpg driver
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
elif DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
)

AsyncSessionLocal = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)


class Base(DeclarativeBase):
    pass


async def get_db():
    # Ensure tables exist even when the serverless platform skips the
    # FastAPI startup event (Vercel does not reliably run it).
    await init_db()
    async with AsyncSessionLocal() as session:
        yield session


_initialized = False


async def init_db():
    """Create tables if needed. Safe to call repeatedly (e.g. per cold start)."""
    global _initialized
    if _initialized:
        return
    from api.models import Document  # noqa: F401
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    _initialized = True
