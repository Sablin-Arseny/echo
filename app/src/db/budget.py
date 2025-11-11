from functools import cache

from sqlalchemy import select, func

from app.src.db.core import BaseDB
from app.src.models import Budget, ExpenseParticipant, User
from app.src.schemas import BudgetCreate, ExpenseParticipantCreate


class BudgetDB(BaseDB):

    @classmethod
    @cache
    def get_as_dependency(cls):
        return cls()

    async def get(self, event_id) -> list[Budget]:
        stmt = select(Budget).where(Budget.event_id == event_id)
        async with self.create_session() as session:
            result = await session.execute(stmt)
            result = result.scalars()
            return list(result)

    async def get_budget_participants(self, budget_id) -> list[ExpenseParticipant]:
        stmt = select(ExpenseParticipant).where(ExpenseParticipant.expense_id == budget_id)

        async with self.create_session() as session:
            result = await session.execute(stmt)
            result = result.scalars()
            return list(result)

    async def create_budget(self, budget_data: BudgetCreate) -> Budget:
        async with self.create_session() as session:
            budget = Budget(**budget_data.model_dump(exclude_none=True))
            session.add(budget)

        async with self.create_session() as session:
            await session.get(Budget, budget.id)
            return budget
    
    async def create_expense_participant(self, participant_data: ExpenseParticipantCreate) -> ExpenseParticipant:
        async with self.create_session() as session:
            participant = ExpenseParticipant(**participant_data.model_dump())
            session.add(participant)

        async with self.create_session() as session:
            await session.get(ExpenseParticipant, participant.id)
            return participant

    async def get_user_expense_participants_by_tg_id(self, user_dict: dict, event_id: int | None = None) -> list[ExpenseParticipant]:
        stmt = (
            select(ExpenseParticipant)
            .join(User, ExpenseParticipant.participant_id == User.id)
            .join(Budget, ExpenseParticipant.expense_id == Budget.id)
        )
        for key, value in user_dict.items():
            if hasattr(User, key) and value is not None:
                stmt = stmt.where(getattr(User, key) == value)
        
        if event_id is not None:
            stmt = stmt.where(Budget.event_id == event_id)
        async with self.create_session() as session:    
            result = await session.execute(stmt)
            return list(result.scalars().all())

    async def get_user_total_expense_by_tg_id(self, user_dict: dict, event_id: int | None = None) -> float:
        stmt = (
            select(func.sum(ExpenseParticipant.share_amount))
            .join(User, ExpenseParticipant.participant_id == User.id)
            .join(Budget, ExpenseParticipant.expense_id == Budget.id)
        )
        for key, value in user_dict.items():
            if hasattr(User, key) and value is not None:
                stmt = stmt.where(getattr(User, key) == value)
        
        if event_id is not None:
            stmt = stmt.where(Budget.event_id == event_id)
        
        async with self.create_session() as session:
            result = await session.execute(stmt)
            total = result.scalar()
            return total or 0.0
