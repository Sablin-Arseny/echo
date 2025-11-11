from functools import cache

from app.src.db.event import EventDB
from app.src.db.group import GroupDB
from app.src.db.user import UserDB
from app.src.schemas import (
    CreateEventRequest,
    User,
    CreateGroupRequest,
    EventResponse,
)


class EventService:
    _event_db: EventDB
    _user_db: UserDB
    _group_db: GroupDB

    def __init__(self, event_db: EventDB, user_db: UserDB, group_db: GroupDB):
        self._event_db = event_db
        self._user_db = user_db
        self._group_db = group_db

    @classmethod
    @cache
    def get_as_dependency(cls):
        return cls(
            EventDB.get_as_dependency(),
            UserDB.get_as_dependency(),
            GroupDB.get_as_dependency(),
        )

    async def create(self, event: CreateEventRequest):
        if event.group_id is None:
            participants = [await self._user_db.get(User(id=uid)) for uid in event.participants]
            group = await self._group_db.create(
                CreateGroupRequest(
                    name=f"{event.name}_group",
                    participants=participants,
                )
            )
            event.group_id = group.id

        event = await self._event_db.create_event(event)
        if not event:
            return
        return await self.get(event.id)

    async def get(self, id: int):
        event = await self._event_db.get_event_by_id(id)
        if not event:
            return None
        return EventResponse.model_validate(event)
