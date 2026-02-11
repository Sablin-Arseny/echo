from datetime import datetime, timezone
from functools import cache

from app.src.db.task import TaskDB
from app.src.db.event import EventDB
from app.src.models import Task, TaskComment
from app.src.schemas import User
from app.src.schemas.task import (
    CreateTaskRequest,
    UpdateTaskRequest,
    TaskResponse,
    TaskCommentResponse,
    TASK_STATUS,
)


def _task_to_response(task: Task) -> TaskResponse:
    observers = [User.model_validate(o.user) for o in task.observers] if task.observers else []
    comments = [
        TaskCommentResponse(
            id=c.id,
            task_id=c.task_id,
            user_id=c.user_id,
            text=c.text,
            created_at=c.created_at,
            author=User.model_validate(c.user) if c.user else None,
        )
        for c in (task.comments or [])
    ]
    return TaskResponse(
        id=task.id,
        event_id=task.event_id,
        author_id=task.author_id,
        executor_id=task.executor_id,
        title=task.title,
        description=task.description,
        status=task.status,
        created_at=task.created_at,
        started_at=task.started_at,
        author=User.model_validate(task.author) if task.author else None,
        executor=User.model_validate(task.executor) if task.executor else None,
        observers=observers,
        comments=comments,
    )


class TaskService:
    _task_db: TaskDB
    _event_db: EventDB

    def __init__(self, task_db: TaskDB, event_db: EventDB):
        self._task_db = task_db
        self._event_db = event_db

    @classmethod
    @cache
    def get_as_dependency(cls):
        return cls(
            TaskDB.get_as_dependency(),
            EventDB.get_as_dependency(),
        )

    async def create(self, payload: CreateTaskRequest, current_user: User) -> TaskResponse:
        event = await self._event_db.get_event_by_id(payload.event_id)
        if not event:
            raise ValueError("Event not found")
        data = {
            "event_id": payload.event_id,
            "title": payload.title,
            "description": payload.description,
            "executor_id": payload.executor_id,
            "author_id": current_user.id,
            "status": "CREATED",
            "observer_ids": payload.observer_ids,
        }
        task = await self._task_db.create(data)
        return _task_to_response(task)

    async def get(self, task_id: int) -> TaskResponse | None:
        task = await self._task_db.get_by_id(task_id)
        if not task:
            return None
        return _task_to_response(task)

    async def update(self, payload: UpdateTaskRequest) -> TaskResponse | None:
        task = await self._task_db.get_by_id(payload.id)
        if not task:
            return None
        data = payload.model_dump(exclude_none=True, exclude={"id"})
        if "status" in data and data["status"] == "IN_PROGRESS" and task.status != "IN_PROGRESS":
            data["started_at"] = datetime.now(timezone.utc).replace(tzinfo=None)
        updated = await self._task_db.update(payload.id, data)
        return _task_to_response(updated) if updated else None

    async def get_list(
        self,
        event_id: int | None = None,
        author_id: int | None = None,
        executor_id: int | None = None,
        observer_id: int | None = None,
        status: TASK_STATUS | None = None,
    ) -> list[TaskResponse]:
        tasks = await self._task_db.get_list(
            event_id=event_id,
            author_id=author_id,
            executor_id=executor_id,
            observer_id=observer_id,
            status=status,
        )
        return [_task_to_response(t) for t in tasks]

    async def add_comment(self, task_id: int, user: User, text: str) -> TaskCommentResponse | None:
        comment = await self._task_db.add_comment(task_id, user.id, text)
        if not comment:
            return None
        return TaskCommentResponse(
            id=comment.id,
            task_id=comment.task_id,
            user_id=comment.user_id,
            text=comment.text,
            created_at=comment.created_at,
            author=User.model_validate(comment.user) if comment.user else None,
        )
