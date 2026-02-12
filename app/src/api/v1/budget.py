from fastapi import APIRouter, Depends, HTTPException

from app.src.schemas import (
    BudgetResponse,
    CreateBudgetRequest,
    UserTotalExpenseResponse,
    User,
    MarkParticipantPaidRequest,
    ConfirmPaymentRequest,
    ParticipantResponse,
)
from app.src.services.budget import BudgetService
from app.src.services.auth import AuthService


router = APIRouter()


@router.post("/create")
async def create_budget(
    budget: CreateBudgetRequest,
    budget_service: BudgetService = Depends(BudgetService.get_as_dependency),
    user: User = Depends(AuthService.check_auth),
) -> BudgetResponse:
    try:
        return await budget_service.create_budget_with_participants(budget, user)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=repr(e))


@router.get("/user_expenses")
async def get_user_expenses(
    event_id: int | None = None,
    budget_service: BudgetService = Depends(BudgetService.get_as_dependency),
    user: User = Depends(AuthService.check_auth),
) -> UserTotalExpenseResponse:
    try:
        return await budget_service.get_user_expenses(user, event_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=repr(e))


@router.get("/{event_id}")
async def get_by_event_id(
    event_id: int,
    budget_service: BudgetService = Depends(BudgetService.get_as_dependency),
) -> list[BudgetResponse]:
    response = [budget async for budget in budget_service.get(event_id=event_id)]
    return response


@router.post("/mark_paid")
async def mark_participant_paid(
    request: MarkParticipantPaidRequest,
    budget_service: BudgetService = Depends(BudgetService.get_as_dependency),
    user: User = Depends(AuthService.check_auth),
) -> ParticipantResponse:
    try:
        return await budget_service.mark_participant_paid(request, user)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=repr(e))


@router.post("/confirm_payment")
async def confirm_payment(
    request: ConfirmPaymentRequest,
    budget_service: BudgetService = Depends(BudgetService.get_as_dependency),
    user: User = Depends(AuthService.check_auth),
) -> ParticipantResponse:
    try:
        return await budget_service.confirm_payment(request, user)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=repr(e))


@router.get("/detail/{budget_id}")
async def get_budget_detail(
    budget_id: int,
    budget_service: BudgetService = Depends(BudgetService.get_as_dependency),
) -> BudgetResponse:
    try:
        return await budget_service.get_budget_detail(budget_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=repr(e))
