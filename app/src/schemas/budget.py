from pydantic import BaseModel, ConfigDict
from typing import Literal

from app.src.schemas.user import User


BUDGET_STATUS = Literal[
    "ACTIVE",
    "PARTIALLY_PAID",
    "CLOSED",
]

PARTICIPANT_STATUS = Literal[
    "PENDING",
    "PAID",
    "CONFIRMED",
]


class ParticipantResponse(BaseModel):
    id: int
    user: User
    share_amount: float
    paid_amount: float = 0.0
    status: PARTICIPANT_STATUS = "PENDING"
    remaining_amount: float

    model_config = ConfigDict(from_attributes=True)


class BudgetResponse(BaseModel):
    id: int
    event_id: int
    paid_by: User
    amount: float
    description: str = ""
    status: BUDGET_STATUS = "ACTIVE"
    participants: list[ParticipantResponse] = []

    model_config = ConfigDict(from_attributes=True)


class CreateBudgetRequest(BaseModel):
    event_id: int
    amount: float
    description: str = ""
    participants: list[str]


class UserExpenseResponse(BaseModel):
    id: int
    budget_id: int
    participant_id: int
    share_amount: float
    status: PARTICIPANT_STATUS


class UserTotalExpenseResponse(BaseModel):
    tg_id: str
    total_amount: float
    expenses: list[UserExpenseResponse]


class MarkParticipantPaidRequest(BaseModel):
    budget_id: int
    amount: float | None = None


class ConfirmPaymentRequest(BaseModel):
    budget_id: int
    participant_tg_id: str
