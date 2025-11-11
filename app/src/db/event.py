from functools import cache

from app.src.db.core import BaseDB
from app.src.models import Event as EventOrm


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
