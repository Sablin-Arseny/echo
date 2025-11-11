from fastapi import APIRouter, Depends, HTTPException

from app.src.db.user import UserDB
from app.src.schemas import User


router = APIRouter()


@router.post("/create")
async def create_user(
    user: User,
    user_db: UserDB = Depends(UserDB.get_as_dependency),
) -> User:
    return await user_db.create(user)


@router.get("/all")
async def get_all_users(
    user_db: UserDB = Depends(UserDB.get_as_dependency),
) -> list[User]:
    return await user_db.get_all()


@router.get("/by_any_id")
async def get_user(
    id: int | None = None,
    username: str | None = None,
    tg_id: str | None = None,
    full_name: str | None = None,
    user_db: UserDB = Depends(UserDB.get_as_dependency),
) -> User:
    user = User(
        id=id,
        username=username,
        tg_id=tg_id,
        full_name=full_name,
    )
    return await user_db.get(user)

@router.get("/check_user")
async def check_user(
    id: int | None = None,
    tg_id: str | None = None,
    username: str | None = None,
    user_db: UserDB = Depends(UserDB.get_as_dependency),
) -> bool:
    user_dict = {}
    if id:
        user_dict["id"] = id
    if tg_id:
        user_dict["tg_id"] = tg_id
    if username:
        user_dict["username"] = username
    if not user_dict:
        raise HTTPException(status_code=400)
    
    user_exists = await user_db.check_user(user_dict)
    if not user_exists:
        raise HTTPException(status_code=404, detail="User not found")
    return True
