from sqlalchemy import Column, String, Integer, ForeignKey, TIMESTAMP, func
from sqlalchemy.orm import relationship

from app.src.models.base import Base


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, autoincrement=True, nullable=False)
    name = Column(String, nullable=False)
    description = Column(String)
    start_date = Column(TIMESTAMP(timezone=True), nullable=False)
    cancel_of_event_date = Column(TIMESTAMP(timezone=True))
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())
    tg_chat = Column(String)
    event_place = Column(String)

    budget = relationship("Budget", back_populates="events")
    tasks = relationship("Task", back_populates="events")
    media = relationship("Media", back_populates="events")
    event_members = relationship("EventMember", back_populates="events")
