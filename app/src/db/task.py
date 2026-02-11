from functools import cache

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.src.db.core import BaseDB
from app.src.models import Task, TaskObserver, TaskComment, User as UserOrm
from app.src.schemas.task import TASK_STATUS


class TaskDB(BaseDB):

    @classmethod
    @cache
    def get_as_dependency(cls):
        return cls()

    async def create(self, data: dict) -> Task:
        observer_ids = data.get("observer_ids", [])
        task_data = {k: v for k, v in data.items() if k != "observer_ids"}
        async with self.create_session() as session:
            task = Task(**task_data)
            session.add(task)
            await session.flush()
            for uid in observer_ids:
                session.add(TaskObserver(task_id=task.id, user_id=uid))

        async with self.create_session() as session:
            task = await session.get(
                Task, task.id,
                options=[
                    selectinload(Task.author),
                    selectinload(Task.executor),
                    selectinload(Task.observers).selectinload(TaskObserver.user),
                    selectinload(Task.comments).selectinload(TaskComment.user),
                ],
            )
            return task

    async def get_by_id(self, task_id: int) -> Task | None:
        async with self.create_session() as session:
            task = await session.get(
                Task, task_id,
                options=[
                    selectinload(Task.author),
                    selectinload(Task.executor),
                    selectinload(Task.observers).selectinload(TaskObserver.user),
                    selectinload(Task.comments).selectinload(TaskComment.user),
                ]
            )
            return task

    async def update(self, task_id: int, data: dict) -> Task | None:
        observer_ids = data.pop("observer_ids", None)
        async with self.create_session() as session:
            task = await session.get(Task, task_id)
            if not task:
                return None
            for key, value in data.items():
                if hasattr(task, key):
                    setattr(task, key, value)
            if observer_ids is not None:
                existing = (await session.execute(select(TaskObserver).where(TaskObserver.task_id == task_id))).scalars().all()
                for obs in existing:
                    await session.delete(obs)
                for uid in observer_ids:
                    session.add(TaskObserver(task_id=task_id, user_id=uid))
            await session.flush()

        return await self.get_by_id(task_id)

    async def get_list(
        self,
        event_id: int | None = None,
        author_id: int | None = None,
        executor_id: int | None = None,
        observer_id: int | None = None,
        status: TASK_STATUS | None = None,
    ) -> list[Task]:
        stmt = (
            select(Task)
            .options(
                selectinload(Task.author),
                selectinload(Task.executor),
                selectinload(Task.observers).selectinload(TaskObserver.user),
                selectinload(Task.comments).selectinload(TaskComment.user),
            )
        )
        if event_id is not None:
            stmt = stmt.where(Task.event_id == event_id)
        if author_id is not None:
            stmt = stmt.where(Task.author_id == author_id)
        if executor_id is not None:
            stmt = stmt.where(Task.executor_id == executor_id)
        if observer_id is not None:
            stmt = stmt.join(TaskObserver).where(TaskObserver.user_id == observer_id)
        if status is not None:
            stmt = stmt.where(Task.status == status)

        async with self.create_session() as session:
            result = await session.execute(stmt)
            tasks = result.unique().scalars().all()
        return list(tasks)

    async def add_comment(self, task_id: int, user_id: int, text: str) -> TaskComment | None:
        async with self.create_session() as session:
            task = await session.get(Task, task_id)
            if not task:
                return None
            comment = TaskComment(task_id=task_id, user_id=user_id, text=text)
            session.add(comment)
            await session.flush()

        async with self.create_session() as session:
            comment = await session.get(TaskComment, comment.id, options=[selectinload(TaskComment.user)])
            return comment

    async def get_comments(self, task_id: int) -> list[TaskComment]:
        stmt = (
            select(TaskComment)
            .where(TaskComment.task_id == task_id)
            .options(selectinload(TaskComment.user))
            .order_by(TaskComment.created_at)
        )
        async with self.create_session() as session:
            result = await session.execute(stmt)
            return list(result.scalars().all())
