# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**MiHomes** is a centralized estate management platform for teams managing multiple residential properties. It provides built-in task management, scheduling, and estate-specific features — no external service dependencies.

- **Target users:** 4 team members managing 4 homes
- **Platform:** Web (Next.js) → Mobile (React Native, future)
- **Backend:** Django 5 + DRF + SQLite

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Django 5.1 + Django REST Framework |
| Database | SQLite |
| Frontend | Next.js 14 (App Router) + Tailwind CSS |
| Auth | Username/password + JWT (SimpleJWT) |
| File Storage | Local filesystem / Django media |
| Hosting | Railway or single VPS |

## Repo Structure

```
MiHomes/
├── backend/            # Django project (see Django Project Structure in prd.md)
├── frontend/           # Next.js project
├── docs/
│   ├── prd.md          # Full product requirements (v3)
│   ├── schema.sql      # Database schema
│   ├── api-endpoints.md
│   ├── architecture.md
│   └── phase-plan.md
├── README.md
└── CLAUDE.md
```

## Key Docs

- Product requirements: `docs/prd.md`
- Database schema: `docs/schema.sql`
- API reference: `docs/api-endpoints.md`
- Architecture: `docs/architecture.md`
- Phase plan: `docs/phase-plan.md`

## Getting Started

**Backend (Django):**
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py runserver
```

**Frontend (Next.js):**
```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

**Tests:**
```bash
# Backend
cd backend && python manage.py test

# Single test
python manage.py test apps.homes.tests.test_models.HomeModelTest

# Frontend
cd frontend && npm test
```

**Linting:**
```bash
# Backend
cd backend && ruff check . && ruff format .

# Frontend
cd frontend && npm run lint
```

## Development Notes

- All API querysets are auto-scoped to the requesting user's homes via `HomeFilterMixin`
- Sensitive fields (lock codes, Wi-Fi passwords) are AES-256 encrypted at rest — never returned in standard API responses
- Completion logs use a polymorphic pattern: single `completion_logs` table with `entity_type` + `entity_id`
- Notification triggers live in `backend/apps/notifications/`
