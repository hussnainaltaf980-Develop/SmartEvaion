from pydantic import BaseModel


class ApiResponse(BaseModel):
    success: bool = True
    message: str
    user: dict | None = None
    users: list[dict] | None = None
