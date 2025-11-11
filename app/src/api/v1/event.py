from fastapi import APIRouter, Depends, HTTPException

from app.src.services.event import EventService
from app.src.schemas import CreateEventRequest, EventResponse


router = APIRouter()


@router.post("")
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
