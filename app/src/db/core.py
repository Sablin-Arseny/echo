from contextlib import asynccontextmanager

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.config import settings


db_url = (
    f"postgresql+asyncpg://"
    f"{settings.db_user}:{settings.db_password}@"
    f"{settings.db_host}:{settings.db_port}/"
    f"{settings.db_name}"
)

async_engine = create_async_engine(db_url, echo=settings.db_echo)
session_maker = sessionmaker(
    async_engine,
    expire_on_commit=False,
    class_=AsyncSession,
)


class BaseDB:
    @asynccontextmanager
    async def create_session(self):
        session = session_maker()
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        else:
            await session.commit()
