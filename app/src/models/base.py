from sqlalchemy.orm import declarative_base

from app.src.db.core import async_engine


Base = declarative_base()


async def init_db() -> None:
    async with async_engine.begin() as conn:
        await conn.run_sync(
            lambda sync_conn: Base.metadata.create_all(bind=sync_conn, checkfirst=True)
        )
