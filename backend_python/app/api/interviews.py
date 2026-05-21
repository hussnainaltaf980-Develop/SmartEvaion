from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_admin
from app.db.session import get_db
from app.models.user import User
from app.models.interview_template import InterviewTemplate
from app.schemas.interviews import TemplateCreate

router = APIRouter(prefix="/api/interviews", tags=["interviews"])


@router.get("/")
def list_templates(_: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.query(InterviewTemplate).all()
    return [
        {
            "id": str(t.id),
            "jobTitle": t.job_title,
            "category": t.category,
            "experienceLevel": t.experience_level,
            "questions": t.questions,
            "type": t.type,
            "company": t.company,
            "authorId": str(t.author_id),
            "authorName": t.author_name,
            "createdAt": t.created_at.isoformat(),
        }
        for t in rows
    ]


@router.post("/")
def create_template(payload: TemplateCreate, current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    row = InterviewTemplate(
        job_title=payload.jobTitle,
        category=payload.category,
        experience_level=payload.experienceLevel,
        questions=payload.questions,
        type=payload.type,
        company=payload.company,
        author_id=current_user.id,
        author_name=current_user.name,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"success": True, "template": {"id": str(row.id), "jobTitle": row.job_title}}


@router.delete("/{template_id}")
def delete_template(template_id: int, _: User = Depends(require_admin), db: Session = Depends(get_db)):
    row = db.get(InterviewTemplate, template_id)
    if not row:
        raise HTTPException(status_code=404, detail="Template not found")
    db.delete(row)
    db.commit()
    return {"success": True, "message": "Template deleted"}
