from functools import cache

from app.src.db.event import EventDB
from app.src.db.user import UserDB
from app.src.schemas import (
    CreateEventRequest,
    User,
    EventResponse,
    STATUS,
)


class EventService:
    _event_db: EventDB
    _user_db: UserDB

    def __init__(self, event_db: EventDB, user_db: UserDB):
        self._event_db = event_db
        self._user_db = user_db

    @classmethod
    @cache
    def get_as_dependency(cls):
        return cls(
            EventDB.get_as_dependency(),
            UserDB.get_as_dependency(),
        )

    async def create(self, event: CreateEventRequest, user: User):
        participants = [await self._user_db.get(User(id=uid)) for uid in event.participants]

        event = await self._event_db.create_event(event.model_dump(exclude_none=True, exclude={"participants"}))
        if not event:
            return
        
        for participant in participants:
            await self._event_db.add_relation_event_member(event.id, participant)

        await self._event_db.update_status_of_member(event.id, user.id, "PARTICIPATING")
        
        return await self.get(event.id)

    async def get(self, id: int):
        event = await self._event_db.get_event_by_id(id)
        if not event:
            return None
        return EventResponse.model_validate(event)

    async def get_by_user(self, user: User):
        events = await self._event_db.get_events_by_member(user)
        if not events:
            return []
        return [EventResponse.model_validate(event) for event in events]

    async def get_participants(self, event_id: int) -> list[User]:
        participants = await self._event_db.get_members_by_event_id(event_id)

        if not participants:
            return []

        return [User.model_validate(user) for user in participants]

    async def add_user_to_event(self, event_id: int, participant: User):
        return await self._event_db.add_relation_event_member(event_id, participant)

    async def update_status_of_member(self, event_id: int, user: User, status: STATUS):
        user = await self._user_db.get(user)
        return await self._event_db.update_status_of_member(event_id, user.id, status)
