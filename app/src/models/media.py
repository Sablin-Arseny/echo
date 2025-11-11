from sqlalchemy import Column, String, ForeignKey, Integer
from sqlalchemy.orm import relationship

from app.src.models.base import Base


class Media(Base):
    __tablename__ = "media"

    id = Column(Integer, primary_key=True, nullable=False, autoincrement=True)
    event_id = Column(ForeignKey("events.id"), nullable=False, index=True)
    user_id = Column(ForeignKey("users.id"), nullable=False, index=True)
    image_url = Column(String, nullable=False)

    events = relationship("Event", back_populates="media")
    users = relationship("User", back_populates="media")
