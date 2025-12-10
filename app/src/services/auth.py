from typing import Annotated
from passlib.context import CryptContext
from pydantic import BaseModel
from jose import jwt
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi import HTTPException, Depends

from app.config import settings
from app.src.db.user import UserDB
from app.src.schemas import User


_ALGORITHM = "HS256"
_PWD_CONTEXT = CryptContext(schemes=["bcrypt"], deprecated="auto")


class UserInfo(BaseModel):
    user: User
    password_hash: str


class AuthorizationError(HTTPException):

    def __init__(self):
        super().__init__(status_code=401, detail="Could not validate")


class AuthService:

    _security = HTTPBearer()
    _user_db: UserDB = UserDB.get_as_dependency()

    @classmethod
    async def check_auth(
        cls,
        token: Annotated[HTTPAuthorizationCredentials, Depends(_security)],
    ):
        try:
            data = jwt.decode(
                token.credentials,
                settings.secret_key,
                algorithms=[_ALGORITHM],
                options={"verify_exp": False},
            )
            user_info = UserInfo(**data)
        except Exception:
            raise AuthorizationError()

        try:
            user = await cls._user_db.get(user_info.user)
            assert user.password_hash == user_info.password_hash
            return User.model_validate(user)
        except Exception:
            raise AuthorizationError()

    @classmethod
    def generate_jwt(cls, user: User, password_hash: str):
        to_encode = UserInfo(user=user, password_hash=password_hash)
        encoded_jwt = jwt.encode(
            to_encode.model_dump(),
            settings.secret_key,
            algorithm=_ALGORITHM,
        )

        return encoded_jwt

    @classmethod
    def get_password_hash(cls, password: str) -> str:
        return _PWD_CONTEXT.hash(password)

    @classmethod
    def verify_password(cls, plain_password: str, hashed_password: str) -> bool:
        return _PWD_CONTEXT.verify(plain_password, hashed_password)
