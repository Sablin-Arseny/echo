from functools import cache

from sqlalchemy import select, update, func

from app.src.db.core import BaseDB
from app.src.models import Budget, ExpenseParticipant, User


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

    async def get_budget_by_id(self, budget_id: int) -> Budget | None:
        stmt = select(Budget).where(Budget.id == budget_id)
        async with self.create_session() as session:
            result = await session.execute(stmt)
            return result.scalar_one_or_none()

    async def get_budget_participants(self, budget_id) -> list[ExpenseParticipant]:
        stmt = select(ExpenseParticipant).where(ExpenseParticipant.expense_id == budget_id)

        async with self.create_session() as session:
            result = await session.execute(stmt)
            result = result.scalars()
            return list(result)

    async def get_budget_participant(self, budget_id: int, participant_id: int) -> ExpenseParticipant | None:
        stmt = select(ExpenseParticipant).where(
            ExpenseParticipant.expense_id == budget_id,
            ExpenseParticipant.participant_id == participant_id
        )
        async with self.create_session() as session:
            result = await session.execute(stmt)
            return result.scalar_one_or_none()

    async def create_budget(self, budget_data: dict) -> Budget:
        budget_data["status"] = "ACTIVE"
        if "amount" in budget_data:
            budget_data["amount"] = round(budget_data["amount"], 2)
        async with self.create_session() as session:
            budget = Budget(**budget_data)
            session.add(budget)
            await session.commit()
            await session.refresh(budget)
            return budget

    async def create_expense_participant(self, participant_data: dict) -> ExpenseParticipant:
        participant_data["share_amount"] = round(participant_data.get("share_amount", 0.), 2)
        participant_data["paid_amount"] = round(participant_data.get("paid_amount", 0.), 2)
        participant_data["status"] = participant_data.get("status") or "PENDING"
            
        async with self.create_session() as session:
            participant = ExpenseParticipant(**participant_data)
            session.add(participant)
            await session.commit()
            await session.refresh(participant)
            return participant

    async def update_budget_status(self, budget_id: int, status: str):
        stmt = (
            update(Budget)
            .where(Budget.id == budget_id)
            .values(status=status)
        )
        async with self.create_session() as session:
            await session.execute(stmt)
            await session.commit()
        return await self.get_budget_by_id(budget_id)

    async def mark_participant_paid(self, participant_id: int, paid_amount: float):
        paid_amount = round(paid_amount, 2)
        stmt = (
            update(ExpenseParticipant)
            .where(ExpenseParticipant.id == participant_id)
            .values(paid_amount=paid_amount, status="PAID")
        )
        async with self.create_session() as session:
            await session.execute(stmt)
            await session.commit()

    async def confirm_participant_payment(self, participant_id: int):
        stmt = (
            update(ExpenseParticipant)
            .where(ExpenseParticipant.id == participant_id)
            .values(status="CONFIRMED")
        )
        async with self.create_session() as session:
            await session.execute(stmt)
            await session.commit()

    async def get_participant_by_id(self, participant_id: int) -> ExpenseParticipant | None:
        stmt = select(ExpenseParticipant).where(ExpenseParticipant.id == participant_id)
        async with self.create_session() as session:
            result = await session.execute(stmt)
            return result.scalar_one_or_none()

    async def get_user_expense_participants_by_tg_id(self, tg_id: int, event_id: int | None = None) -> list[ExpenseParticipant]:
        stmt = (
            select(ExpenseParticipant)
            .join(User, ExpenseParticipant.participant_id == User.id)
            .join(Budget, ExpenseParticipant.expense_id == Budget.id)
            .where(User.tg_id == tg_id)
        )

        if event_id is not None:
            stmt = stmt.where(Budget.event_id == event_id)
        async with self.create_session() as session:    
            result = await session.execute(stmt)
            return list(result.scalars().all())

    async def get_user_total_expense_by_tg_id(self, tg_id: int, event_id: int | None = None) -> float:
        stmt = (
            select(func.sum(ExpenseParticipant.share_amount))
            .join(User, ExpenseParticipant.participant_id == User.id)
            .join(Budget, ExpenseParticipant.expense_id == Budget.id)
            .where(User.tg_id == tg_id)
        )

        if event_id is not None:
            stmt = stmt.where(Budget.event_id == event_id)
        
        async with self.create_session() as session:
            result = await session.execute(stmt)
            total = result.scalar()
            return total or 0.0

    async def get_budget_participants_with_status(self, budget_id: int) -> list[ExpenseParticipant]:
            stmt = select(ExpenseParticipant).where(ExpenseParticipant.expense_id == budget_id)
            async with self.create_session() as session:
                result = await session.execute(stmt)
                return list(result.scalars().all())

    async def recalculate_budget_status(self, budget_id: int):
        participants = await self.get_budget_participants_with_status(budget_id)
        
        if not participants:
            return
        
        all_confirmed = all(p.status == "CONFIRMED" for p in participants)
        any_paid_or_confirmed = any(p.status in ["PAID", "CONFIRMED"] for p in participants)
        
        status = "ACTIVE"

        if all_confirmed:
            status = "CLOSED"
        elif any_paid_or_confirmed:
            status = "PARTIALLY_PAID"

        await self.update_budget_status(budget_id, status)
