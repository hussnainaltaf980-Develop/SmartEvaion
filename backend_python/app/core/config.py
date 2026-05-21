from pydantic import BaseModel


class Settings(BaseModel):
    app_name: str = "SmartEvaion Python API"
    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 12
    sqlite_url: str = "sqlite:///./smartevaion.db"


settings = Settings()
