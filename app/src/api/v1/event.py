from fastapi import APIRouter, Depends, HTTPException

from app.src.services.event import EventService
from app.src.services.auth import AuthService

from app.src.schemas import CreateEventRequest, EventResponse, UpdateEvent, User, STATUS


router = APIRouter()


@router.post("/create")
async def create_event(
    event: CreateEventRequest,
    event_service: EventService = Depends(EventService.get_as_dependency),
    user: User = Depends(AuthService.check_auth),
) -> EventResponse:
    try:
        event_response = await event_service.create(event, user)
        participants = await event_service.get_participants(event_response.id)
        event_response = EventResponse.model_validate(event_response)
        event_response.participants = participants
        return event_response
    except Exception as e:
        raise HTTPException(status_code=500, detail=repr(e))


@router.patch("/update")
async def update_event(
    event: UpdateEvent,
    event_service: EventService = Depends(EventService.get_as_dependency),
    user: User = Depends(AuthService.check_auth),
) -> EventResponse:
    try:
        event = await event_service.update(event)
        participants = await event_service.get_participants(event.id)
        event = EventResponse.model_validate(event)
        event.participants = participants
        return event
    except Exception as e:
        raise HTTPException(status_code=500, detail=repr(e))


@router.get("/get_user_events")
async def get_user_events(
    status: STATUS | None = None,
    event_service: EventService = Depends(EventService.get_as_dependency),
    user: User = Depends(AuthService.check_auth),
) -> list[EventResponse]:
    try:
        events = await event_service.get_by_user(user, status)
        for event in events:
            participants = await event_service.get_participants(event.id)
            event.participants = participants
        return events
    except Exception as e:
        raise HTTPException(status_code=500, detail=repr(e))


@router.get("/{id}")
async def get_event_by_id(
    id: int,
    event_service: EventService = Depends(EventService.get_as_dependency),
) -> EventResponse:
    event = await event_service.get(id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    participants = await event_service.get_participants_with_status(id)
    event_response = EventResponse.model_validate(event)
    event_response.participants = participants
    return event


@router.post("/add_user_to_event")
async def add_user_to_event(
    event_id: int,
    user: User,
    event_service: EventService = Depends(EventService.get_as_dependency),
) -> EventResponse:
    try:
        event = await event_service.add_user_to_event(event_id=event_id, user=user)
        participants = await event_service.get_participants(event_id)
        participants = [User.model_validate(user) for user in participants]
        event_response = EventResponse.model_validate(event)
        event_response.participants = participants
    except Exception as e:
        raise HTTPException(status_code=500, detail=repr(e))
    return event_response


@router.post("/update_status_of_member")
async def update_status_of_member(
    event_id: int,
    user: User,
    status: STATUS,
    event_service: EventService = Depends(EventService.get_as_dependency)
) -> EventResponse:
    try:
        event = await event_service.update_status_of_member(event_id=event_id, user=user, status=status)
    except Exception as e:
        raise HTTPException(status_code=500, detail=repr(e))
    return event
