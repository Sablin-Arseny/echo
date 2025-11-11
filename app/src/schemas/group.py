from pydantic import BaseModel

from app.src.schemas import User


class CreateGroupRequest(BaseModel):
    name: str
    participants: list[User]


class GroupResponse(BaseModel):
    id: int
    name: str
    participants: list[User]
