from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_admin
from app.core.security import hash_password
from app.db.session import get_db
from app.models.user import User
from app.schemas.common import ApiResponse
from app.services.users import user_to_client_dict

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/")
def get_users(_: User = Depends(require_admin), db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [user_to_client_dict(u) for u in users]


@router.post("/", response_model=ApiResponse)
def create_user(payload: dict, _: User = Depends(require_admin), db: Session = Depends(get_db)):
    email = str(payload.get("email", "")).lower()
    if not email:
        raise HTTPException(status_code=400, detail="email is required")
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="Email already exists")

    user = User(
        email=email,
        password_hash=hash_password(payload.get("password") or "password123"),
        role=payload.get("role", "candidate"),
        name=payload.get("name", "Unnamed"),
        father_name=payload.get("fatherName"),
        dob=payload.get("dob"),
        cnic=payload.get("cnic"),
        mobile=payload.get("mobile"),
        photo_url=payload.get("photoUrl"),
        company=payload.get("company"),
        company_name=payload.get("companyName"),
        company_logo=payload.get("companyLogo"),
        company_registration_number=payload.get("companyRegistrationNumber"),
        disabled=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return ApiResponse(message="User created", user=user_to_client_dict(user))


@router.put("/{user_id}", response_model=ApiResponse)
def update_profile(user_id: int, payload: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if current_user.id != user.id and current_user.role not in {"super-admin", "content-manager"}:
        raise HTTPException(status_code=403, detail="Forbidden")

    for attr, key in {
        "name": "name",
        "father_name": "fatherName",
        "dob": "dob",
        "cnic": "cnic",
        "mobile": "mobile",
        "photo_url": "photoUrl",
        "company": "company",
        "company_name": "companyName",
        "company_logo": "companyLogo",
        "company_registration_number": "companyRegistrationNumber",
    }.items():
        if key in payload:
            setattr(user, attr, payload[key])

    db.commit()
    db.refresh(user)
    return ApiResponse(message="Profile updated", user=user_to_client_dict(user))


@router.put("/{user_id}/status", response_model=ApiResponse)
def toggle_status(user_id: int, _: User = Depends(require_admin), db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.disabled = not user.disabled
    db.commit()
    db.refresh(user)
    return ApiResponse(message="User status updated", user=user_to_client_dict(user))


@router.put("/{user_id}/role", response_model=ApiResponse)
def update_role(user_id: int, payload: dict, _: User = Depends(require_admin), db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = payload.get("newRole", user.role)
    db.commit()
    db.refresh(user)
    return ApiResponse(message="Role updated", user=user_to_client_dict(user))
