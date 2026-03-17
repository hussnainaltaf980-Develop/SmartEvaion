from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.interview_session import InterviewSession
from app.models.user import User
from app.schemas.interviews import SessionCreate, SessionStatusUpdate
from app.services.realtime import realtime_hub

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


@router.get("/")
def list_sessions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(InterviewSession)
    if current_user.role == "candidate":
        query = query.filter(InterviewSession.user_id == current_user.id)
    rows = query.all()
    return [
        {
            "id": str(s.id),
            "title": s.title,
            "userId": str(s.user_id),
            "userName": s.user_name,
            "templateId": str(s.template_id),
            "jobTitle": s.job_title,
            "company": s.company,
            "status": s.status,
            "overallScore": s.overall_score,
            "startedAt": s.started_at.isoformat() if s.started_at else None,
            "completedAt": s.completed_at.isoformat() if s.completed_at else None,
            "overallFeedback": s.overall_feedback,
            "overallStrengths": s.overall_strengths,
            "overallAreasForImprovement": s.overall_areas_for_improvement,
            "results": s.results,
        }
        for s in rows
    ]


@router.post("/")
def create_session(payload: SessionCreate, _: User = Depends(get_current_user), db: Session = Depends(get_db)):
    row = InterviewSession(
        title=payload.title,
        user_id=int(payload.userId),
        user_name=payload.userName,
        template_id=int(payload.templateId),
        job_title=payload.jobTitle,
        company=payload.company,
        status="pending",
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"success": True, "session": {"id": str(row.id), "status": row.status}}


@router.put("/{session_id}/complete")
async def complete_session(session_id: int, payload: dict, _: User = Depends(get_current_user), db: Session = Depends(get_db)):
    session = db.get(InterviewSession, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    session.status = "completed"
    session.completed_at = datetime.utcnow()
    session.overall_score = payload.get("overallScore")
    session.overall_feedback = payload.get("overallFeedback")
    session.overall_strengths = payload.get("overallStrengths") or []
    session.overall_areas_for_improvement = payload.get("overallAreasForImprovement") or []
    session.results = payload.get("results") or []
    db.commit()
    await realtime_hub.send_to_user(str(session.user_id), {"type": "session.completed", "sessionId": str(session.id)})
    return {"success": True, "message": "Session completed"}


@router.patch("/{session_id}/status")
async def update_status(session_id: int, payload: SessionStatusUpdate, _: User = Depends(get_current_user), db: Session = Depends(get_db)):
    session = db.get(InterviewSession, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    session.status = payload.status
    db.commit()
    await realtime_hub.send_to_user(str(session.user_id), {"type": "session.status", "status": payload.status, "sessionId": str(session.id)})
    return {"success": True, "message": "Session status updated"}
