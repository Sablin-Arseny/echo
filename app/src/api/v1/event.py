from fastapi import APIRouter, Depends, HTTPException

from app.src.db.event import EventDB
from app.src.services.event import EventService
from app.src.schemas import CreateEventRequest, EventResponse, User


router = APIRouter()


@router.post("/create")
async def create_event(
    event: CreateEventRequest,
    event_service: EventService = Depends(EventService.get_as_dependency)
) -> EventResponse:
    try:
        event_response = await event_service.create(event)
        participants = await event_service.get_participants(event_response.id)
        event_response = EventResponse.model_validate(event_response)
        event_response.participants = participants
        return event_response
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
    participants = await event_service.get_participants(id)
    event_response = EventResponse.model_validate(event)
    event_response.participants = participants
    return event


@router.post("/add_user_to_event")
async def add_user_to_event(
    event_id: int,
    user: User,
    event_db: EventDB = Depends(EventDB.get_as_dependency)
) -> EventResponse:
    try:
        event = await event_db.add_relation_event_member(event_id=event_id, user=user)
        participants = await event_db.get_members_by_event_id(event_id)
        participants = [User.model_validate(user) for user in participants]
        event_response = EventResponse.model_validate(event)
        event_response.participants = participants
    except Exception as e:
        raise HTTPException(status_code=500, detail=repr(e))
    return event_response
