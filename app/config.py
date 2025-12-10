from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # project
    name: str = "echo"
    app_host: str = "0.0.0.0"
    app_port: int = 8000

    # PostgreSQL
    db_name: str = "echo_db"
    db_user: str = "postgres"
    db_password: str = "postgres"

    db_host: str = "localhost"
    db_port: int = 5432
    db_echo: bool = False

    # Auth
    secret_key: str = "<KEY>"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
