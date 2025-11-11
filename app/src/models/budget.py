from sqlalchemy import Column, String, Integer, ForeignKey, Float, text
from sqlalchemy.orm import relationship

from app.src.models.base import Base


class Budget(Base):
    __tablename__ = "budget"

    id = Column(Integer, primary_key=True, nullable=False, autoincrement=True)
    event_id = Column(ForeignKey("events.id"), nullable=False, index=True)
    paid_by_id = Column(ForeignKey("users.id"), nullable=False, index=True)
    amount = Column(Float, nullable=False, server_default=text("0.0"))
    description = Column(String)

    events = relationship("Event", back_populates="budget")
    users = relationship("User", back_populates="budget")
    expense_participants = relationship("ExpenseParticipant", back_populates="budget")
