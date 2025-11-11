from pydantic import BaseModel, ConfigDict
from datetime import datetime


class CreateEventRequest(BaseModel):
    group_id: int | None = None
    name: str
    description: str | None = None
    start_date: datetime
    cancel_of_event_date: datetime | None = None
    event_place: str | None = None
    participants: list[int]


class EventResponse(BaseModel):
    id: int
    group_id: int
    name: str
    description: str | None = None
    start_date: datetime
    cancel_of_event_date: datetime | None = None
    created_at: datetime
    tg_chat: str | None = None
    event_place: str | None = None

    model_config = ConfigDict(from_attributes=True)
