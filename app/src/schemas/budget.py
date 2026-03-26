from pydantic import BaseModel, ConfigDict, Field, model_validator
from typing import Literal

from app.src.schemas.user import User


BUDGET_STATUS = Literal[
    "ACTIVE",
    "PARTIALLY_PAID",
    "CLOSED",
    "DELETED",
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
    participants: list[ParticipantResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class BudgetParticipantRequest(BaseModel):
    tg_id: str
    share_amount: int | None = None


class CreateBudgetRequest(BaseModel):
    event_id: int
    amount: float | None = None
    is_equally: bool
    description: str = ""
    participants: list[BudgetParticipantRequest]

    @model_validator(mode="after")
    def validate_amount_requirement(self):
        if self.is_equally and self.amount is None:
            raise ValueError("amount is required when is_equally is True")
        return self


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
