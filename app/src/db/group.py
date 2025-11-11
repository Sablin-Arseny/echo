from functools import cache

from sqlalchemy import select

from app.src.db.core import BaseDB
from app.src.models import Group, GroupMember, User
from app.src.schemas import GroupResponse, CreateGroupRequest


class GroupDB(BaseDB):
    
    @classmethod
    @cache
    def get_as_dependency(cls):
        return cls()

    async def create(self, group: CreateGroupRequest):
        async with self.create_session() as session:
            group_orm = Group(**group.model_dump(exclude_none=True, exclude={"participants"}))
            session.add(group_orm)
            await session.commit()
            await session.refresh(group_orm)
            group_id = group_orm.id

            for person in group.participants:
                group_member = GroupMember(group_id=group_id, user_id=person.id)
                session.add(group_member)

        return await self.get(group_id)

    async def get(self, id) -> GroupResponse | None:
        async with self.create_session() as session:
            group = await session.get(Group, id)
        if not group:
            return

        stmt = (
            select(User)
            .join(GroupMember, GroupMember.user_id == User.id)
            .where(GroupMember.group_id == id)
        )
        async with self.create_session() as session:
            result = await session.execute(stmt)
            participants = result.scalars().all()

        return GroupResponse(
            id=group.id,
            name=group.name,
            participants=participants
        )
