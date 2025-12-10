from functools import cache

from sqlalchemy import select

from app.src.db.core import BaseDB
from app.src.models import Event as EventOrm
from app.src.models import EventMember, User


class EventDB(BaseDB):

    @classmethod
    @cache
    def get_as_dependency(cls):
        return cls()
    
    async def create_event(self, event: dict) -> EventOrm:
        async with self.create_session() as session:
            event = EventOrm(**event)
            session.add(event)

        async with self.create_session() as session:
            event = await session.get(EventOrm, event.id)
            return event

    async def get_event_by_id(self, event_id: int) -> EventOrm:
        async with self.create_session() as session:
            result = await session.get(EventOrm, event_id)
            return result

    async def add_relation_event_member(self, event_id: int, user: User):
        async with self.create_session() as session:
            event_member = EventMember(event_id=event_id, user_id=user.id)
            session.add(event_member)
        return await self.get_event_by_id(event_id)

    async def get_members_by_event_id(self, event_id: int):
        stmt = (
            select(User)
            .join(EventMember, User.id == EventMember.user_id)
            .where(EventMember.event_id == event_id)
        )
        async with self.create_session() as session:
            members = await session.execute(stmt)
            members = members.scalars().all()
        return list(members) if members else None
