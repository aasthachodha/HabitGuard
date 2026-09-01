# Commitment Habits

A commitment-based habit accountability app.

## Features
- Signup/login with protected dashboard access.
- Create financial commitments for habits.
- Daily completion/missed records.
- Streak and escalation tracking.
- Persistent JSON-backed database for local development.
- Progress graph generated from stored daily records.

## Run locally

### Backend
```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

The frontend expects the backend at `http://localhost:5000`.

## Database structure
`backend/data/db.json` contains three collections:
- `users`: account information and password hashes.
- `commitments`: each user's habit/financial commitment.
- `dailyProgress`: one record per commitment/day, used to calculate streaks and the dashboard graph.

This file-backed database is intentionally simple for local development. It can later be replaced with MongoDB without changing the product flow.
