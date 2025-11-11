from pydantic import BaseModel

from app.src.schemas.user import User


class FullBudgetResponse(BaseModel):
    id: int
    event_id: int
    paid_by: User
    amount: float
    description: str = ""
    participants: list[User]


class BudgetRequest(BaseModel):
    id: int | None = None
    event_id: int
    paid_by: User
    amount: float
    description: str = ""
    participants: list[str]


class BudgetCreate(BaseModel):
    event_id: int
    paid_by_id: int
    amount: float
    description: str = ""


class ExpenseParticipantCreate(BaseModel):
    expense_id: int
    participant_id: int
    share_amount: float


class UserExpenseResponse(BaseModel):
    id: int
    budget_id: int
    participant_id: int
    share_amount: float


class UserTotalExpenseResponse(BaseModel):
    tg_id: str
    total_amount: float
    expenses: list[UserExpenseResponse]
