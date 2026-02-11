from sqlalchemy import Column, String, ForeignKey, Integer, TIMESTAMP, Text, func
from sqlalchemy.orm import relationship

from app.src.models.base import Base


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, nullable=False, autoincrement=True)
    event_id = Column(ForeignKey("events.id"), nullable=False, index=True)
    executor_id = Column(ForeignKey("users.id"), nullable=False, index=True)
    author_id = Column(ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    description = Column(String)
    status = Column(String, nullable=False, server_default="CREATED", index=True)
    created_at = Column(TIMESTAMP, nullable=False, server_default=func.now())
    started_at = Column(TIMESTAMP, nullable=True)  # дата когда статус стал "выполняется"

    event = relationship("Event", back_populates="tasks")
    executor = relationship("User", back_populates="tasks_executor", foreign_keys=[executor_id])
    author = relationship("User", back_populates="tasks_author", foreign_keys=[author_id])
    observers = relationship("TaskObserver", back_populates="task", cascade="all, delete-orphan")
    comments = relationship("TaskComment", back_populates="task", cascade="all, delete-orphan", order_by="TaskComment.created_at")


class TaskObserver(Base):
    """Наблюдатели задачи (many-to-many task — user)."""
    __tablename__ = "task_observers"

    task_id = Column(ForeignKey("tasks.id"), primary_key=True, nullable=False)
    user_id = Column(ForeignKey("users.id"), primary_key=True, nullable=False)

    task = relationship("Task", back_populates="observers")
    user = relationship("User", back_populates="task_observers")


class TaskComment(Base):
    __tablename__ = "task_comments"

    id = Column(Integer, primary_key=True, nullable=False, autoincrement=True)
    task_id = Column(ForeignKey("tasks.id"), nullable=False, index=True)
    user_id = Column(ForeignKey("users.id"), nullable=False, index=True)
    text = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP, nullable=False, server_default=func.now())

    task = relationship("Task", back_populates="comments")
    user = relationship("User", back_populates="task_comments")
