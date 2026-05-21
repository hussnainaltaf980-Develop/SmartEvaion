from pydantic import BaseModel


class TemplateCreate(BaseModel):
    jobTitle: str
    category: str
    experienceLevel: str
    questions: list[str]
    type: str
    company: str | None = None


class SessionCreate(BaseModel):
    title: str
    userId: str
    userName: str
    templateId: str
    jobTitle: str
    company: str | None = None


class SessionStatusUpdate(BaseModel):
    status: str
