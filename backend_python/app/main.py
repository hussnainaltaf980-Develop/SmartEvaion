from jose import JWTError, jwt
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.api import auth, users, interviews, sessions, ai, coding
from app.core.config import settings
from app.db.session import Base, engine, SessionLocal
from app.db.seed import seed_default_data
from app.services.realtime import realtime_hub

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()
    try:
        seed_default_data(db)
    finally:
        db.close()


@app.get("/api/health")
def health():
    return {"status": "UP"}


app.include_router(auth.router)
app.include_router(users.router)
app.include_router(interviews.router)
app.include_router(sessions.router)
app.include_router(ai.router)
app.include_router(coding.router)


@app.websocket("/")
async def ws_root(websocket: WebSocket):
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=1008, reason="Token not provided")
        return

    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        user_id = payload.get("sub")
        if not user_id:
            raise JWTError("Missing subject")
    except JWTError:
        await websocket.close(code=1008, reason="Invalid token")
        return

    await realtime_hub.connect(str(user_id), websocket)
    try:
        while True:
            _ = await websocket.receive_text()
    except WebSocketDisconnect:
        realtime_hub.disconnect(str(user_id), websocket)
