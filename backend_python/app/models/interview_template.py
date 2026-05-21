from datetime import datetime
from sqlalchemy import String, JSON, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class InterviewTemplate(Base):
    __tablename__ = "interview_templates"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    job_title: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(128), nullable=False)
    experience_level: Mapped[str] = mapped_column(String(128), nullable=False)
    questions: Mapped[list[str]] = mapped_column(JSON, default=list)
    type: Mapped[str] = mapped_column(String(64), nullable=False)
    company: Mapped[str | None] = mapped_column(String(255))
    author_id: Mapped[int] = mapped_column(index=True)
    author_name: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
