from pydantic import BaseModel, ConfigDict


class User(BaseModel):
    id: int | None = None
    username: str | None = None
    tg_id: str | None = None
    full_name: str | None = None

    model_config = ConfigDict(from_attributes=True)
