from sqlalchemy import Column, ForeignKey, Integer, Float, String, text
from sqlalchemy.orm import relationship

from app.src.models.base import Base


class ExpenseParticipant(Base):
    __tablename__ = "expense_participants"

    id = Column(Integer, primary_key=True, nullable=False, autoincrement=True)
    expense_id = Column(ForeignKey("budget.id"), nullable=False, index=True)
    participant_id = Column(ForeignKey("users.id"), nullable=False, index=True)
    share_amount = Column(Float, nullable=False, server_default=text("0.0"))
    paid_amount = Column(Float, nullable=False, server_default=text("0.0"))
    status = Column(String, nullable=False, server_default=text("'PENDING'"))

    budget = relationship("Budget", back_populates="expense_participants")
    users = relationship("User", back_populates="expense_participants")
