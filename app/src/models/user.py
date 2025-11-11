from sqlalchemy import Column, String, Integer
from sqlalchemy.orm import relationship

from app.src.models.base import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True, nullable=False)
    username = Column(String, unique=True, nullable=False)
    tg_id = Column(String, unique=True, nullable=False)
    full_name = Column(String)

    group_members = relationship("GroupMember", back_populates="users")
    tasks_author = relationship("Task", back_populates="author", foreign_keys="Task.author_id")
    tasks_executor = relationship("Task", back_populates="executor", foreign_keys="Task.executor_id")
    media = relationship("Media", back_populates="users")
    expense_participants = relationship("ExpenseParticipant", back_populates="users")
    budget = relationship("Budget", back_populates="users")
