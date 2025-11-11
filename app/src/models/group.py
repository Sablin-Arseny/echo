from sqlalchemy import Column, String, Integer
from sqlalchemy.orm import relationship

from app.src.models.base import Base


class Group(Base):
    __tablename__ = "groups"

    id = Column(Integer, primary_key=True, autoincrement=True, nullable=False)
    name = Column(String, nullable=False)

    group_members = relationship("GroupMember", back_populates="groups")
    events = relationship("Event", back_populates="groups")
