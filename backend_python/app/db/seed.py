from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.user import User
from app.models.interview_template import InterviewTemplate


def seed_default_data(db: Session) -> None:
    if db.query(User).count() == 0:
        owner = User(
            email="hussnainmr07@gmail.com",
            password_hash=hash_password("Romio@47"),
            role="super-admin",
            name="Hussnain (Owner)",
            company_name="HussnainTechVertex",
            disabled=False,
            photo_url="https://ui-avatars.com/api/?name=Hussnain&background=0D8ABC&color=fff",
        )
        candidate = User(
            email="candidate@example.com",
            password_hash=hash_password("password123"),
            role="candidate",
            name="John Doe",
            father_name="Richard Doe",
            dob="1995-08-15",
            cnic="12345-6789012-3",
            mobile="+15551234567",
            photo_url="https://ui-avatars.com/api/?name=John+Doe&background=random",
            disabled=False,
        )
        db.add_all([owner, candidate])
        db.flush()

    if db.query(InterviewTemplate).count() == 0:
        template = InterviewTemplate(
            job_title="Senior Frontend Developer",
            category="Software Engineering",
            experience_level="Senior",
            questions=[
                "Explain the difference between let, const, and var in JavaScript.",
                "What are Angular Signals and how do they improve change detection?",
            ],
            type="technical",
            company="HussnainTechVertex Pvt Ltd.",
            author_id=1,
            author_name="Hussnain",
        )
        db.add(template)

    db.commit()
