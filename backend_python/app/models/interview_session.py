from datetime import datetime
from sqlalchemy import String, JSON, DateTime, Float
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    user_id: Mapped[int] = mapped_column(index=True)
    user_name: Mapped[str] = mapped_column(String(255), nullable=False)
    template_id: Mapped[int] = mapped_column(index=True)
    job_title: Mapped[str] = mapped_column(String(255), nullable=False)
    company: Mapped[str | None] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(String(64), default="pending")
    overall_score: Mapped[float | None] = mapped_column(Float)
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime)
    overall_feedback: Mapped[str | None] = mapped_column(String(5000))
    overall_strengths: Mapped[list[str]] = mapped_column(JSON, default=list)
    overall_areas_for_improvement: Mapped[list[str]] = mapped_column(JSON, default=list)
    results: Mapped[list[dict]] = mapped_column(JSON, default=list)
