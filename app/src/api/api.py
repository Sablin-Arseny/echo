from fastapi import APIRouter

from app.src.api.duty import router as duty_router
from app.src.api.v1.budget import router as budget_router
from app.src.api.v1.user import router as user_router
from app.src.api.v1.event import router as event_router
from  app.src.api.v1.group import router as group_router


router = APIRouter()

router.include_router(
    duty_router,
    prefix="",
    tags=["duty"],
)
router.include_router(
    budget_router,
    prefix="/budget",
    tags=["budget"],
)
router.include_router(
    user_router,
    prefix="/user",
    tags=["user"],
)
router.include_router(
    event_router,
    prefix="/event",
    tags=["event"],
)
router.include_router(
    group_router,
    prefix="/group",
    tags=["group"],
)
