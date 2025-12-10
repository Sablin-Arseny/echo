from fastapi import APIRouter, Depends, HTTPException

from app.src.schemas import User
from app.src.db.user import UserDB
from app.src.services.auth import AuthService


router = APIRouter()


@router.post("/register")
async def register(
    user: User,
    password: str,
    user_db: UserDB = Depends(UserDB.get_as_dependency),
):
    password_hash = AuthService.get_password_hash(password)
    await user_db.create(user, password_hash)
    token = AuthService.generate_jwt(user, password_hash)
    return token


@router.post("/login")
async def login(
    user: User,
    password: str,
    user_db: UserDB = Depends(UserDB.get_as_dependency),
):
    user_in_db = await user_db.get(user)
    if not user_in_db:
        raise HTTPException(status_code=404, detail="User not found")
    if not AuthService.verify_password(password, user_in_db.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect password")
    token = AuthService.generate_jwt(user, user_in_db.password_hash)
    return token


@router.get("/get_info")
async def get_info(
    user: User = Depends(AuthService.check_auth),
) -> User:
    return user
