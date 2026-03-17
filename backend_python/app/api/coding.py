from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/coding", tags=["coding"])


@router.get("/problems")
def get_problems(_: User = Depends(get_current_user)):
    return [
        {"id": "1", "title": "Two Sum", "difficulty": "Easy", "description": "Return indexes of two numbers that sum to target."},
        {"id": "2", "title": "Valid Parentheses", "difficulty": "Easy", "description": "Validate matching parentheses in a string."},
    ]


@router.post("/execute")
def execute_code(payload: dict, _: User = Depends(get_current_user)):
    code = payload.get("code", "")
    return {"success": True, "output": f"Code received ({len(code)} chars). Sandboxed execution not enabled in demo backend."}
