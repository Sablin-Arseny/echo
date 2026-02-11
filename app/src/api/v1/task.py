from fastapi import APIRouter, Depends, HTTPException, Query

from app.src.schemas import User
from app.src.schemas.task import (
    CreateTaskRequest,
    UpdateTaskRequest,
    TaskResponse,
    TaskCommentCreate,
    TaskCommentResponse,
    TASK_STATUS,
)
from app.src.services.task import TaskService
from app.src.services.auth import AuthService


router = APIRouter()


@router.post("/create")
async def create_task(
    payload: CreateTaskRequest,
    task_service: TaskService = Depends(TaskService.get_as_dependency),
    user: User = Depends(AuthService.check_auth),
) -> TaskResponse:
    try:
        return await task_service.create(payload, user)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/list")
async def get_tasks(
    event_id: int | None = Query(None, description="Фильтр по мероприятию"),
    author_id: int | None = Query(None, description="Фильтр по автору"),
    executor_id: int | None = Query(None, description="Фильтр по исполнителю"),
    observer_id: int | None = Query(None, description="Фильтр по наблюдателю"),
    status: TASK_STATUS | None = Query(None, description="Фильтр по статусу"),
    task_service: TaskService = Depends(TaskService.get_as_dependency),
    user: User = Depends(AuthService.check_auth),
) -> list[TaskResponse]:
    return await task_service.get_list(
        event_id=event_id,
        author_id=author_id,
        executor_id=executor_id,
        observer_id=observer_id,
        status=status,
    )


@router.get("/{task_id}")
async def get_task(
    task_id: int,
    task_service: TaskService = Depends(TaskService.get_as_dependency),
    user: User = Depends(AuthService.check_auth),
) -> TaskResponse:
    task = await task_service.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.patch("/update")
async def update_task(
    payload: UpdateTaskRequest,
    task_service: TaskService = Depends(TaskService.get_as_dependency),
    user: User = Depends(AuthService.check_auth),
) -> TaskResponse:
    task = await task_service.update(payload)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.patch("/update_status")
async def update_task_status(
    task_id: int,
    status: TASK_STATUS,
    task_service: TaskService = Depends(TaskService.get_as_dependency),
    user: User = Depends(AuthService.check_auth),
) -> TaskResponse:
    task = await task_service.update(UpdateTaskRequest(id=task_id, status=status))
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.post("/comment")
async def add_comment(
    payload: TaskCommentCreate,
    task_service: TaskService = Depends(TaskService.get_as_dependency),
    user: User = Depends(AuthService.check_auth),
) -> TaskCommentResponse:
    comment = await task_service.add_comment(payload.task_id, user, payload.text)
    if not comment:
        raise HTTPException(status_code=404, detail="Task not found")
    return comment
