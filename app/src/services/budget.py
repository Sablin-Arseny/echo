from functools import cache

from app.src.db.budget import BudgetDB
from app.src.db.user import UserDB
from app.src.schemas import (
    BudgetResponse,
    User,
    CreateBudgetRequest,
    UserExpenseResponse,
    UserTotalExpenseResponse,
    MarkParticipantPaidRequest,
    ConfirmPaymentRequest,
    ParticipantResponse,
)


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
        budgets = await self._budget_db.get(event_id)
        for budget in budgets:
            yield await self._build_budget_response(budget)

    async def _build_participant_response(
        self, participant, user_orm
    ) -> ParticipantResponse:
        user = User.model_validate(user_orm)

        if participant.status == "CONFIRMED":
            remaining = 0.0
            paid_amount = participant.share_amount
        else:
            remaining = round(participant.share_amount - participant.paid_amount, 2)
            paid_amount = round(participant.paid_amount, 2)

        return ParticipantResponse(
            id=participant.id,
            user=user,
            share_amount=round(participant.share_amount, 2),
            paid_amount=paid_amount,
            status=participant.status,
            remaining_amount=remaining,
        )

    async def _build_budget_response(self, budget) -> BudgetResponse:
        paid_by_orm = await self._user_db.get(User(id=budget.paid_by_id))
        paid_by = User.model_validate(paid_by_orm)

        participants_orm = await self._budget_db.get_budget_participants(budget.id)
        participants = []

        for participant in participants_orm:
            user_orm = await self._user_db.get(User(id=participant.participant_id))
            participant_response = await self._build_participant_response(
                participant, user_orm
            )
            participants.append(participant_response)

        return BudgetResponse(
            id=budget.id,
            event_id=budget.event_id,
            paid_by=paid_by,
            amount=budget.amount,
            description=budget.description or "",
            status=budget.status,
            participants=participants,
        )

    async def create_budget_with_participants(
        self, budget_request: CreateBudgetRequest, paid_by: User
    ) -> BudgetResponse:
        paid_by_user_orm = await self._user_db.get(User(tg_id=paid_by.tg_id))
        if not paid_by_user_orm:
            raise ValueError(f"User with tg_id {paid_by.tg_id} not found")

        # Получить всех участников и валидировать
        participants_map = {}  # tg_id -> User ORM
        for participant_request in budget_request.participants:
            user_orm = await self._user_db.get(User(tg_id=participant_request.tg_id))
            if not user_orm:
                raise ValueError(
                    f"User with tg_id {participant_request.tg_id} not found"
                )
            participants_map[participant_request.tg_id] = user_orm

        # Рассчитать общую сумму
        if budget_request.is_equally:
            total_amount = budget_request.amount
        else:
            # Рассчитать сумму из share_amount всех участников
            total_amount = sum(
                participant.share_amount or 0
                for participant in budget_request.participants
            )
            total_amount = round(total_amount, 2)

        budget_data = {
            "event_id": budget_request.event_id,
            "paid_by_id": paid_by_user_orm.id,
            "amount": total_amount,
            "description": budget_request.description,
        }
        budget_orm = await self._budget_db.create_budget(budget_data)

        # Вычислить доли
        if budget_request.is_equally:
            # Делить поровну
            share_amount = round(
                total_amount / len(budget_request.participants),
                2,
            )
            for participant_request in budget_request.participants:
                user_orm = participants_map[participant_request.tg_id]

                # Если это создатель бюджета - отмечаем как CONFIRMED
                if user_orm.id == paid_by_user_orm.id:
                    participant_data = {
                        "expense_id": budget_orm.id,
                        "participant_id": user_orm.id,
                        "share_amount": share_amount,
                        "paid_amount": share_amount,
                        "status": "CONFIRMED",
                    }
                else:
                    participant_data = {
                        "expense_id": budget_orm.id,
                        "participant_id": user_orm.id,
                        "share_amount": share_amount,
                    }
                await self._budget_db.create_expense_participant(participant_data)
        else:
            # Использовать индивидуальные доли
            for participant_request in budget_request.participants:
                user_orm = participants_map[participant_request.tg_id]
                share_amount = round(participant_request.share_amount or 0, 2)

                # Если это создатель бюджета - отмечаем как CONFIRMED
                if user_orm.id == paid_by_user_orm.id:
                    participant_data = {
                        "expense_id": budget_orm.id,
                        "participant_id": user_orm.id,
                        "share_amount": share_amount,
                        "paid_amount": share_amount,
                        "status": "CONFIRMED",
                    }
                else:
                    participant_data = {
                        "expense_id": budget_orm.id,
                        "participant_id": user_orm.id,
                        "share_amount": share_amount,
                    }
                await self._budget_db.create_expense_participant(participant_data)

        await self._budget_db.recalculate_budget_status(budget_orm.id)

        return await self.get_budget_detail(budget_orm.id)

    async def mark_participant_paid(
        self, request: MarkParticipantPaidRequest, current_user: User
    ) -> ParticipantResponse:
        budget = await self._budget_db.get_budget_by_id(request.budget_id)
        if not budget:
            raise ValueError(f"Budget with id {request.budget_id} not found")

        if budget.status == "CLOSED":
            raise ValueError("Budget is already closed")

        participant_orm = await self._user_db.get(User(tg_id=current_user.tg_id))
        if not participant_orm:
            raise ValueError(f"User with tg_id {request.participant_tg_id} not found")

        current_user_orm = await self._user_db.get(User(tg_id=current_user.tg_id))
        if current_user_orm.id != participant_orm.id:
            raise ValueError("You can only mark your own debts as paid")

        expense_participant = await self._budget_db.get_budget_participant(
            request.budget_id, participant_orm.id
        )
        if not expense_participant:
            raise ValueError("User is not a participant in this budget")

        if expense_participant.status == "CONFIRMED":
            raise ValueError("This debt is already confirmed")

        paid_amount = request.amount

        if paid_amount is None or paid_amount <= 0:
            raise ValueError("Payment amount must be positive")

        if paid_amount > expense_participant.share_amount:
            paid_amount = expense_participant.share_amount

        await self._budget_db.mark_participant_paid(expense_participant.id, paid_amount)

        await self._budget_db.recalculate_budget_status(request.budget_id)

        updated_participant = await self._budget_db.get_budget_participant(
            request.budget_id, participant_orm.id
        )

        return await self._build_participant_response(
            updated_participant, participant_orm
        )

    async def confirm_payment(
        self, request: ConfirmPaymentRequest, current_user: User
    ) -> ParticipantResponse:
        budget = await self._budget_db.get_budget_by_id(request.budget_id)
        if not budget:
            raise ValueError(f"Budget with id {request.budget_id} not found")

        if budget.status == "CLOSED":
            raise ValueError("Budget is already closed")

        current_user_orm = await self._user_db.get(User(tg_id=current_user.tg_id))
        if current_user_orm.id != budget.paid_by_id:
            raise ValueError("Only the budget creator can confirm payments")

        participant_orm = await self._user_db.get(User(tg_id=request.participant_tg_id))
        if not participant_orm:
            raise ValueError(f"User with tg_id {request.participant_tg_id} not found")

        expense_participant = await self._budget_db.get_budget_participant(
            request.budget_id, participant_orm.id
        )
        if not expense_participant:
            raise ValueError("User is not a participant in this budget")

        if expense_participant.status == "CONFIRMED":
            raise ValueError("This debt is already confirmed")

        if expense_participant.paid_amount < expense_participant.share_amount:
            raise ValueError(
                f"Cannot confirm partial payment. "
                f"Participant has paid {expense_participant.paid_amount}/{expense_participant.share_amount}. "
                f"Full payment required for confirmation."
            )

        await self._budget_db.confirm_participant_payment(expense_participant.id)

        await self._budget_db.recalculate_budget_status(request.budget_id)

        updated_participant = await self._budget_db.get_budget_participant(
            request.budget_id, participant_orm.id
        )

        return await self._build_participant_response(
            updated_participant, participant_orm
        )

    async def get_user_expenses(
        self, user: User, event_id: int | None = None
    ) -> UserTotalExpenseResponse:
        user_orm = await self._user_db.get(user)
        if not user_orm:
            raise ValueError("User not found")

        total_amount = await self._budget_db.get_user_total_expense_by_tg_id(
            user_orm.tg_id, event_id
        )

        expense_participants = (
            await self._budget_db.get_user_expense_participants_by_tg_id(
                user_orm.tg_id, event_id
            )
        )

        expenses = []
        for ep in expense_participants:
            expenses.append(
                UserExpenseResponse(
                    id=ep.id,
                    budget_id=ep.expense_id,
                    participant_id=ep.participant_id,
                    share_amount=ep.share_amount,
                    status=ep.status,
                )
            )

        return UserTotalExpenseResponse(
            tg_id=user_orm.tg_id, total_amount=total_amount, expenses=expenses
        )

    async def get_budget_detail(self, budget_id: int) -> BudgetResponse:
        budget = await self._budget_db.get_budget_by_id(budget_id)
        if not budget:
            raise ValueError(f"Budget with id {budget_id} not found")

        return await self._build_budget_response(budget)

    async def delete_budget(self, budget_id: int, paid_by: User) -> BudgetResponse:
        budget = await self._budget_db.get_budget_by_id(budget_id)
        if not budget:
            raise ValueError(f"Budget with id {budget_id} not found")

        if paid_by.id != budget.paid_by_id:
            raise ValueError("Only the budget creator can delete it")

        await self._budget_db.update_budget_status(budget_id, "DELETED")

        return await self.get_budget_detail(budget_id)
