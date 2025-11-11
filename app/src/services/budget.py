from functools import cache

from app.src.db.budget import BudgetDB
from app.src.db.user import UserDB
from app.src.schemas import BudgetResponse, User, CreateBudgetRequest, UserExpenseResponse, UserTotalExpenseResponse


class BudgetService:
    _budget_db: BudgetDB
    _user_db: UserDB

    def __init__(self, budget_db: BudgetDB, user_db: UserDB):
        self._budget_db = budget_db
        self._user_db = user_db

    @classmethod
    @cache
    def get_as_dependency(cls):
        return cls(BudgetDB.get_as_dependency(), UserDB.get_as_dependency())

    async def get(self, event_id: int):
        budgets =  await self._budget_db.get(event_id)
        for budget in budgets:
            paid_by_orm = await self._user_db.get(User(id=budget.paid_by_id))
            paid_by = User.model_validate(paid_by_orm)

            participants_orm = await self._budget_db.get_budget_participants(budget.id)
            participants = []

            for participant in participants_orm:
                user_orm = await self._user_db.get(User(id=participant.participant_id))
                user = User.model_validate(user_orm)
                participants.append(user)

            yield BudgetResponse(
                id=budget.id,
                event_id=event_id,
                paid_by=paid_by,
                amount=budget.amount,
                description=budget.description,
                participants=participants,
            )

    async def create_budget_with_participants(self, budget_request: CreateBudgetRequest) -> BudgetResponse:
        paid_by_user_orm = await self._user_db.get(User(tg_id=budget_request.paid_by.tg_id))
        if not paid_by_user_orm:
            raise ValueError(f"User with tg_id {budget_request.paid_by.tg_id} not found")

        budget_data = {
            "event_id": budget_request.event_id,
            "paid_by_id": paid_by_user_orm.id,
            "amount": budget_request.amount,
            "description": budget_request.description
        }
        budget_orm = await self._budget_db.create_budget(budget_data)

        share_amount = budget_request.amount / len(budget_request.participants) if budget_request.participants else 0

        for tg_id in budget_request.participants:
            user_orm = await self._user_db.get(User(tg_id=tg_id))
            if not user_orm:
                raise ValueError(f"User with tg_id {tg_id} not found")

            participant_data = {
                "expense_id": budget_orm.id,
                "participant_id": user_orm.id,
                "share_amount": share_amount,
            }
            await self._budget_db.create_expense_participant(participant_data)

        participants_orm = await self._budget_db.get_budget_participants(budget_orm.id)
        participants_users = []
        
        for participant in participants_orm:
            user_orm = await self._user_db.get(User(id=participant.participant_id))
            user = User.model_validate(user_orm)
            participants_users.append(user)

        paid_by = User.model_validate(paid_by_user_orm)

        return BudgetResponse(
            id=budget_orm.id,
            event_id=budget_orm.event_id,
            paid_by=paid_by,
            amount=budget_orm.amount,
            description=budget_orm.description,
            participants=participants_users,
        )

    async def get_user_expenses(self, user_dict: dict, event_id: int | None = None) -> UserTotalExpenseResponse:
        user = await self._user_db.get(User(**user_dict))
        if not user:
            raise ValueError(f"User not found")
        
        total_amount = await self._budget_db.get_user_total_expense_by_tg_id(user_dict, event_id)
        
        expense_participants = await self._budget_db.get_user_expense_participants_by_tg_id(user_dict, event_id)
        
        expenses = []
        for ep in expense_participants:
            expenses.append(UserExpenseResponse(
                id=ep.id,
                budget_id=ep.expense_id,
                participant_id=ep.participant_id,
                share_amount=ep.share_amount
            ))
        
        return UserTotalExpenseResponse(
            tg_id=user.tg_id,
            total_amount=total_amount,
            expenses=expenses
        )
