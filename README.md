<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1vhSjB8g-epmWUE1CKB9XnYI202MMVVpU

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](AIzaSyCRJmhnPEPx88kTcnhJnf1KSZ4ynMexOe8) to your Gemini API key
3. Run the app:
   `npm run dev`

## Python full-stack backend

This repo now also includes a Python FastAPI backend in `backend_python/` with:

- Modular API (`auth`, `users`, `interviews`, `sessions`, `ai`, `coding`)
- SQLite database with SQLAlchemy models
- JWT authentication and role checks
- WebSocket real-time channel compatible with the frontend token query format

See setup steps in `backend_python/README.md`.
