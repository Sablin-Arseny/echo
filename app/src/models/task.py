from sqlalchemy import Column, String, ForeignKey, Integer, TIMESTAMP, func
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
    status = Column(String, nullable=False, unique=True, server_default="CREATED")
    created_at = Column(TIMESTAMP, nullable=False, server_default=func.now())

    events = relationship("Event", back_populates="tasks")
    executor = relationship("User", back_populates="tasks_executor", foreign_keys=[executor_id])
    author = relationship("User", back_populates="tasks_author", foreign_keys=[author_id])
