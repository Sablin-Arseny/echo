from functools import cache

from sqlalchemy import select

from app.src.db.core import BaseDB
from app.src.models import User as UserOrm
from app.src.schemas import User


class UserDB(BaseDB):

    @classmethod
    @cache
    def get_as_dependency(cls):
        return cls()

    async def create(self, user: User, password_hash: str):
        async with self.create_session() as session:
            user = UserOrm(**user.model_dump(exclude_none=True), password_hash=password_hash)
            session.add(user)

        async with self.create_session() as session:
            await session.get(UserOrm, user.id)
            return user

    async def update(self, user: User, update_user: User):
        async with self.create_session() as session:
            user_orm = await session.get(UserOrm, user.id)
            update_data = update_user.model_dump(exclude_none=True)

            for key, value in update_data.items():
                if key == 'id':
                    raise Exception("Нельзя менять id")
                else:
                    setattr(user_orm, key, value)

            await session.commit()
            await session.refresh(user_orm)
            return user_orm

    async def get(self, user: User):
        stmt = select(UserOrm)
        for key, value in user.model_dump(exclude_none=True).items():
            stmt = stmt.where(getattr(UserOrm, key) == value)

        async with self.create_session() as session:
            user = await session.scalar(stmt)
            return user

    async def get_all(self):
        stmt = select(UserOrm)

        async with self.create_session() as session:
            users = await session.scalars(stmt)
            return users.all()

    async def check_user(self, user_dict: dict) -> bool:
        stmt = select(UserOrm)
        for key, value in user_dict.items():
            if hasattr(UserOrm, key) and value is not None:
                stmt = stmt.where(getattr(UserOrm, key) == value)
        async with self.create_session() as session:
            user = await session.scalar(stmt)
            return user is not None
