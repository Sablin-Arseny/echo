from fastapi import APIRouter
from fastapi.responses import PlainTextResponse


router = APIRouter()


@router.get("/ping")
async def ping() -> PlainTextResponse:
    return "pong"
