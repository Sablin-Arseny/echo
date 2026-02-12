from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict

from app.src.schemas.user import User


TASK_STATUS = Literal[
    "CREATED",  # новый
    "IN_PROGRESS",  # выполняется
    "IN_REVIEW",  # на проверке
    "DONE",  # выполнено
]


class CreateTaskRequest(BaseModel):
    event_id: int
    title: str
    description: str | None = None
    executor_id: int
    observer_ids: list[int] = []


class UpdateTaskRequest(BaseModel):
    id: int
    title: str | None = None
    description: str | None = None
    executor_id: int | None = None
    observer_ids: list[int] | None = None
    status: TASK_STATUS | None = None


class TaskCommentCreate(BaseModel):
    task_id: int
    text: str


class TaskCommentResponse(BaseModel):
    id: int
    task_id: int
    user_id: int
    text: str
    created_at: datetime
    author: User | None = None

    model_config = ConfigDict(from_attributes=True)


class TaskResponse(BaseModel):
    id: int
    event_id: int
    author_id: int
    executor_id: int
    title: str
    description: str | None = None
    status: str
    created_at: datetime
    started_at: datetime | None = None
    author: User | None = None
    executor: User | None = None
    observers: list[User] = []
    comments: list[TaskCommentResponse] = []

    model_config = ConfigDict(from_attributes=True)
