from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Literal

from app.src.schemas import User, Participant


STATUS = Literal[
    "INVITED",
    "REFUSED",
    "PARTICIPATING",
    "DELETED",
    "DRAFT",
]


class CreateEventRequest(BaseModel):
    name: str
    description: str | None = None
    start_date: datetime
    cancel_of_event_date: datetime | None = None
    event_place: str | None = None
    participants: list[int]


class EventResponse(BaseModel):
    id: int
    name: str
    description: str | None = None
    start_date: datetime
    cancel_of_event_date: datetime | None = None
    created_at: datetime
    tg_chat: str | None = None
    event_place: str | None = None
    participants: list[User | Participant] = []

    model_config = ConfigDict(from_attributes=True)


class UpdateEvent(BaseModel):
    id: int
    name: str
    description: str | None = None
    start_date: datetime
    cancel_of_event_date: datetime | None = None
    event_place: str | None = None
