# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**MiHomes** is a centralized estate management platform for teams managing multiple residential properties. It integrates with Microsoft 365 (Planner, Outlook, SharePoint) and layers purpose-built estate management features on top.

- **Name origin:** 터 (Korean) — "foundation, ground, site"
- **Target users:** 4 team members managing 4 homes
- **Platform:** Web (Next.js) + Mobile (React Native)
- **Backend:** Django 5 + DRF + PostgreSQL + Microsoft Graph API

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Django 5.1 + Django REST Framework 3.15 |
| Database | PostgreSQL 16 |
| Real-time | Django Channels + Redis |
| Task Queue | Celery + Redis |
| Frontend (Web) | Next.js 14 (App Router) |
| Frontend (Mobile) | React Native (Expo) |
| Auth | Microsoft SSO (Azure AD) + JWT |
| Tasks/Kanban | Microsoft Planner via Graph API |
| Calendar | Outlook Group Calendar via Graph API |
| File Storage | SharePoint/OneDrive via Graph API |
| Hosting | Railway (API) + Vercel (Next.js) |

## Repo Structure

```
MiHomes/
├── backend/        # Django project
├── frontend/       # Next.js project
├── docs/
│   ├── prd.md              # Full product requirements
│   ├── schema.sql          # PostgreSQL schema
│   ├── api-endpoints.md    # REST API reference
│   ├── architecture.md     # System architecture
│   └── phase-plan.md       # Development phase plan
└── CLAUDE.md
```

## Key Docs

- Product requirements: `docs/prd.md`
- Database schema: `docs/schema.sql`
- API reference: `docs/api-endpoints.md`
- Architecture: `docs/architecture.md`
- Phase plan: `docs/phase-plan.md`

## Getting Started

> To be updated once backend/frontend scaffolding is complete.

**Backend (Django):**
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # fill in secrets
python manage.py migrate
python manage.py runserver
```

**Frontend (Next.js):**
```bash
cd frontend
npm install
cp .env.local.example .env.local   # fill in secrets
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
- Microsoft Graph calls go through a centralized `GraphClient` wrapper in `backend/integrations/graph/`
- WebSocket consumers live in `backend/apps/realtime/`
- Celery Beat tasks live in `backend/apps/notifications/tasks.py`
