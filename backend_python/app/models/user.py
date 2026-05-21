from sqlalchemy import String, Boolean
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(64), default="candidate")
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    father_name: Mapped[str | None] = mapped_column(String(255))
    dob: Mapped[str | None] = mapped_column(String(32))
    cnic: Mapped[str | None] = mapped_column(String(64))
    mobile: Mapped[str | None] = mapped_column(String(64))
    photo_url: Mapped[str | None] = mapped_column(String(512))
    company: Mapped[str | None] = mapped_column(String(255))
    company_name: Mapped[str | None] = mapped_column(String(255))
    company_logo: Mapped[str | None] = mapped_column(String(512))
    company_registration_number: Mapped[str | None] = mapped_column(String(128))
    disabled: Mapped[bool] = mapped_column(Boolean, default=False)
