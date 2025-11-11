from sqlalchemy import Column, ForeignKey
from sqlalchemy.orm import relationship

from app.src.models.base import Base


class GroupMember(Base):
    __tablename__ = "group_member"

    group_id = Column(ForeignKey("groups.id"), primary_key=True,  nullable=False)
    user_id = Column(ForeignKey("users.id"), primary_key=True,  nullable=False)

    users = relationship("User", back_populates="group_members")
    groups = relationship("Group", back_populates="group_members")
