from fastapi import APIRouter, Depends, HTTPException, Query

from app.src.schemas import FullBudgetResponse, BudgetRequest, UserTotalExpenseResponse, UserExpenseResponse
from app.src.services.budget import BudgetService


router = APIRouter()


@router.get("/full/{event_id}")
async def get_full(
    event_id: int,
    budget_service: BudgetService = Depends(BudgetService.get_as_dependency),
) -> list[FullBudgetResponse]:
    response = [budget async for budget in budget_service.get(event_id=event_id)]
    return response

@router.post("/create")
async def create_budget(
    budget_request: BudgetRequest,
    budget_service: BudgetService = Depends(BudgetService.get_as_dependency),
) -> FullBudgetResponse:
    try:
        return await budget_service.create_budget_with_participants(budget_request)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=repr(e))

@router.get("/user_expenses/")
async def get_user_expenses(
    id: int | None = None,
    tg_id: str | None = None,
    username: str | None = None,
    event_id: int | None = None,
    budget_service: BudgetService = Depends(BudgetService.get_as_dependency),
) -> UserTotalExpenseResponse:
    user_dict = {}
    if id:
        user_dict["id"] = id
    if tg_id:
        user_dict["tg_id"] = tg_id
    if username:
        user_dict["username"] = username
    if not user_dict:
        raise HTTPException(status_code=400)
    try:
        return await budget_service.get_user_expenses(user_dict, event_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=repr(e))
