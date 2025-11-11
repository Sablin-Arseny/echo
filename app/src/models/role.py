from sqlalchemy import Column, String, Integer
from sqlalchemy.orm import relationship

from app.src.models.base import Base


class Role(Base):
    # TODO link with group members
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, autoincrement=True, nullable=False)
    name = Column(String, unique=True, nullable=False)
