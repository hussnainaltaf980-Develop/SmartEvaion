from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import verify_password, create_access_token, hash_password
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from app.schemas.common import ApiResponse
from app.services.users import user_to_client_dict

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=ApiResponse)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")

    user = User(
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
        role=payload.role,
        name=payload.name,
        father_name=payload.fatherName,
        dob=payload.dob,
        cnic=payload.cnic,
        mobile=payload.mobile,
        photo_url=payload.photoUrl,
        company=payload.company,
        company_name=payload.companyName,
        company_logo=payload.companyLogo,
        company_registration_number=payload.companyRegistrationNumber,
        disabled=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return ApiResponse(success=True, message="User created", user=user_to_client_dict(user))


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if user.disabled:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account disabled")

    token = create_access_token(subject=str(user.id))
    return TokenResponse(success=True, token=token, user=user_to_client_dict(user), message="Login successful")
