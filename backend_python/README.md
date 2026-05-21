# SmartEvaion Python Backend (FastAPI)

This backend replaces/augments the Node API with a Python-based full-stack server foundation:

- **Framework:** FastAPI
- **Database:** SQLite via SQLAlchemy ORM
- **Auth:** JWT bearer tokens + password hashing (bcrypt)
- **Realtime:** WebSocket endpoint compatible with frontend token flow (`ws://host/?token=...`)
- **Modules:** auth, users, interviews, sessions, AI stubs, coding stubs

## Run

```bash
cd backend_python
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Frontend integration

The Angular app already calls `/api/*`. To wire frontend -> Python backend in development, run the frontend dev server with a proxy to `http://localhost:8000` for `/api` and websocket traffic.

## Default seed users

- `hussnainmr07@gmail.com` / `Romio@47` (super-admin)
- `candidate@example.com` / `password123` (candidate)
