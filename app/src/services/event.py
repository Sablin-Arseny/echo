from functools import cache

from app.src.db.event import EventDB
from app.src.db.user import UserDB
from app.src.schemas import (
    CreateEventRequest,
    User,
    Participant,
    EventResponse,
    UpdateEvent,
    STATUS,
    ROLES,
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
        participants = [
            await self._user_db.get(User(id=uid)) for uid in event.participants
        ]

        event = await self._event_db.create_event(
            event.model_dump(exclude_none=True, exclude={"participants"})
        )
        if not event:
            return

        await self._event_db.add_relation_event_member(event.id, user, "OWNER")
        for participant in participants:
            await self._event_db.add_relation_event_member(
                event.id, participant, "PARTICIPANT"
            )

        await self._event_db.update_status_of_member(event.id, user.id, "PARTICIPATING")

        return await self.get(event.id)

    async def update(self, event: UpdateEvent):
        update_event = event.model_dump(exclude_none=True, exclude={"id"})
        event = await self._event_db.update_event(event.id, update_event)
        return EventResponse.model_validate(event)

    async def get(self, id: int):
        event = await self._event_db.get_event_by_id(id)
        if not event:
            return None
        return EventResponse.model_validate(event)

    async def get_by_user(self, user: User, status: STATUS | None):
        events = await self._event_db.get_events_by_member(user, status)
        if not events:
            return []
        return [EventResponse.model_validate(event) for event in events]

    async def get_participants(self, event_id: int) -> list[Participant]:
        result = await self._event_db.get_members_by_event_id(event_id)

        if not result:
            return []

        participants = []
        for user_orm, status in result:
            participant = Participant.model_validate(user_orm)
            participant.status = status
            participants.append(participant)

        return participants

    async def add_user_to_event(self, event_id: int, user_to_add: User, user: User):
        participants = await self.get_participants(event_id)
        users = [p for p in participants if p.id == user.id]
        if not user:
            raise LookupError(f"User is not found for event {event_id}")
        user_role = users[0].role
        if user_role != "ADMIN" or user_role != "OWNER":
            raise ValueError("User role must be ADMIN or OWNER")
        user_to_add = await self._user_db.get(user_to_add)
        return await self._event_db.add_relation_event_member(event_id, user_to_add, "PARTICIPANT")

    async def update_member_role(
        self, event_id: int, user_to_update: User, role: ROLES, user: User
    ):
        participants = await self.get_participants(event_id)
        users = [p for p in participants if p.id == user.id]
        if not user:
            raise LookupError(f"User is not found for event {event_id}")
        user_role = users[0].role
        if user_role != "ADMIN" or user_role != "OWNER":
            raise ValueError("User role must be ADMIN or OWNER")
        if role == "ADMIN" and user_role != "PARTICIPANT":
            raise ValueError("ADMIN can't update OWNER or ADMIN")

        user_to_update = await self._user_db.get(user_to_update)
        return await self._event_db.update_role_of_member(event_id, user_to_update)

    async def update_status_of_member(self, event_id: int, user: User, status: STATUS):
        user = await self._user_db.get(user)
        return await self._event_db.update_status_of_member(event_id, user.id, status)
