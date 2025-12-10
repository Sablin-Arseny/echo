from sqlalchemy import Column, ForeignKey
from sqlalchemy.orm import relationship

from app.src.models.base import Base


class EventMember(Base):
    __tablename__ = "event_member"

    event_id = Column(ForeignKey("events.id"), primary_key=True,  nullable=False)
    user_id = Column(ForeignKey("users.id"), primary_key=True,  nullable=False)

    users = relationship("User", back_populates="event_members")
    events = relationship("Event", back_populates="event_members")
