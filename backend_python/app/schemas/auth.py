from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    role: str = "candidate"
    name: str
    fatherName: str | None = None
    dob: str | None = None
    cnic: str | None = None
    mobile: str | None = None
    photoUrl: str | None = None
    company: str | None = None
    companyName: str | None = None
    companyLogo: str | None = None
    companyRegistrationNumber: str | None = None


class TokenResponse(BaseModel):
    success: bool = True
    token: str
    user: dict
    message: str | None = None
