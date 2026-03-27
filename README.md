# MiHomes



MiHomes is a centralized estate management platform for teams managing multiple residential properties. It layers purpose-built estate tools on top of Microsoft 365 — giving property teams a single place to organize tasks, people, vendors, maintenance, and critical home information across all their homes.

---

## What it does

- **Tasks & Kanban** — bidirectional sync with Microsoft Planner; board and list views
- **Calendar** — read/write to Outlook Group Calendar; events and tasks in one view
- **Documents** — upload to SharePoint/OneDrive, organized by home and category
- **Maintenance** — track recurring tasks with dynamic status (overdue/due soon/on track) and auto-calculated next due dates
- **Home Info** — secure storage for lock codes, Wi-Fi passwords, appliance warranties, utility bills, smart home systems, emergency info, and more
- **People & Vendors** — directory of residents, staff, contacts, and service vendors across all homes
- **Collaboration** — real-time activity log with @mentions, bulletin board, protocols, and checklists
- **Notifications** — in-app + real-time push alerts for overdue maintenance, expiring warranties, assigned tasks, and more

---

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

---

## Repo Structure

```
MiHomes/
├── backend/            # Django project
├── frontend/           # Next.js project
├── docs/
│   ├── prd.md          # Full product requirements
│   ├── schema.sql      # PostgreSQL schema
│   ├── api-endpoints.md
│   ├── architecture.md
│   └── phase-plan.md
├── README.md
└── CLAUDE.md
```

---

## Getting Started

> Prerequisites: Python 3.12+, Node 20+, PostgreSQL 16, Redis

### Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements/development.txt
cp .env.example .env    # fill in secrets (see below)
python manage.py migrate
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

### Environment Variables

**Backend (`.env`):**

```
SECRET_KEY=
DATABASE_URL=
REDIS_URL=
AZURE_AD_CLIENT_ID=
AZURE_AD_CLIENT_SECRET=
AZURE_AD_TENANT_ID=
ENCRYPTION_KEY=          # AES-256 key for sensitive fields
```

**Frontend (`.env.local`):**

```
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_WS_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
```

---

## Running Tests

```bash
# Backend — full suite
cd backend && python manage.py test

# Backend — single test
python manage.py test apps.homes.tests.test_models.HomeModelTest

# Frontend
cd frontend && npm test
```

---

## Linting

```bash
# Backend
cd backend && ruff check . && ruff format .

# Frontend
cd frontend && npm run lint
```

---

## Security Notes

- **Authentication:** Microsoft SSO only (Azure AD OAuth 2.0) — no local passwords
- **Sensitive fields:** Lock codes and Wi-Fi passwords are AES-256 encrypted at rest and never returned in standard API responses. Decryption requires an explicit `?reveal=true` param, which triggers an immutable access log entry.
- **Query scoping:** All API queries are automatically filtered to homes the requesting user belongs to via `HomeFilterMixin` — cross-home data leakage is prevented at the ORM level.
- **Roles:** 4-tier per-home role system — Owner, Admin, Manager, Viewer.

---

## Documentation

| Doc | Description |
|-----|-------------|
| [docs/prd.md](docs/prd.md) | Full product requirements and feature inventory |
| [docs/schema.sql](docs/schema.sql) | PostgreSQL schema with all tables and indexes |
| [docs/api-endpoints.md](docs/api-endpoints.md) | REST API and WebSocket reference |
| [docs/architecture.md](docs/architecture.md) | System architecture, auth flow, Graph sync strategy |
| [docs/phase-plan.md](docs/phase-plan.md) | 6-phase, 17-week development plan |

---

## Development Status

| Phase | Scope | Status |
|-------|-------|--------|
| 1 | Foundation + Microsoft 365 integration | Not started |
| 2 | Core estate features | Not started |
| 3 | Collaboration + notifications | Not started |
| 4 | Next.js web frontend | Not started |
| 5 | Enhanced features (P2) | Not started |
| 6 | Mobile + polish + production | Not started |
