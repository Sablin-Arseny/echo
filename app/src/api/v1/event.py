from fastapi import APIRouter, Depends, HTTPException

from app.src.services.event import EventService
from app.src.schemas import CreateEventRequest, EventResponse


router = APIRouter()


@router.post("/create")
async def create_event(
    event: CreateEventRequest,
    event_service: EventService = Depends(EventService.get_as_dependency)
) -> EventResponse:
    try:
        return await event_service.create(event)
    except Exception as e:
        raise HTTPException(status_code=500, detail=repr(e))


@router.get("/{id}")
async def get_event_by_id(
    id: int,
    event_service: EventService = Depends(EventService.get_as_dependency)
) -> EventResponse:
    event = await event_service.get(id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


@router.post("/add_user_to_event")
async def add_user_to_event(
    event_id: int,
    user_id: int | None = None,
    tg_id: str | None = None,
    username: str | None = None,
    event_service: EventService = Depends(EventService.get_as_dependency)
) -> EventResponse:
    try:
        event = await event_service.add_user_to_event(event_id=event_id, user_id=user_id, tg_id=tg_id, username=username)
    except Exception as e:
        raise HTTPException(status_code=500, detail=repr(e))
    return event
