from fastapi import APIRouter, Depends, HTTPException

from app.src.db.user import UserDB
from app.src.schemas import User


router = APIRouter()


@router.get("/all")
async def get_all_users(
    user_db: UserDB = Depends(UserDB.get_as_dependency),
) -> list[User]:
    return await user_db.get_all()


@router.get("/by_any_id")
async def get_user(
    id: int | None = None,
    tg_id: str | None = None,
    username: str | None = None,
    full_name: str | None = None,
    user_db: UserDB = Depends(UserDB.get_as_dependency),
) -> User:
    user = User(
        id=id,
        username=username,
        tg_id=tg_id,
        full_name=full_name,
    )
    user_response = await user_db.get(user)
    if not user_response:
        raise HTTPException(status_code=404, detail="User not found")
    return user_response

@router.get("/check_user")
async def check_user(
    id: int | None = None,
    tg_id: str | None = None,
    username: str | None = None,
    user_db: UserDB = Depends(UserDB.get_as_dependency),
) -> bool:
    user = await get_user(id=id, username=username, tg_id=tg_id, user_db=user_db)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return True
