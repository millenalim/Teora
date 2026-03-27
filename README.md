# MiHomes

MiHomes is a centralized estate management platform for teams managing multiple residential properties. It provides built-in task management, scheduling, and estate-specific features — giving property teams a single place to organize tasks, people, vendors, maintenance, and critical home information across all their homes.

---

## What it does

- **Tasks & Kanban** — built-in kanban board and list view with drag-and-drop
- **Calendar** — monthly grid with events and tasks, color-coded by home
- **Maintenance** — recurring task tracking with dynamic status and auto-calculated next due dates
- **Home Info** — secure storage for lock codes, Wi-Fi passwords, appliance warranties, utility bills, smart home systems, emergency info, and more
- **People & Vendors** — directory of residents, staff, contacts, and service vendors across all homes
- **Collaboration** — activity log with @mentions, bulletin board, protocols, and checklists
- **Documents** — file upload and management per home
- **Notifications** — in-app alerts for overdue maintenance, expiring warranties, assigned tasks, and more

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Django 5.1 + Django REST Framework |
| Database | SQLite |
| Frontend | Next.js 14 (App Router) + Tailwind CSS |
| Auth | Username/password + JWT (SimpleJWT) |
| File Storage | Local filesystem / Django media |
| Hosting | Railway or single VPS |

---

## Repo Structure

```
MiHomes/
├── backend/            # Django project
├── frontend/           # Next.js project
├── docs/
│   ├── prd.md          # Full product requirements
│   ├── schema.sql      # Database schema
│   ├── api-endpoints.md
│   ├── architecture.md
│   └── phase-plan.md
├── README.md
└── CLAUDE.md
```

---

## Getting Started

> Prerequisites: Python 3.12+, Node 20+

### Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
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
DEBUG=True
ENCRYPTION_KEY=    # AES-256 key for sensitive fields
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

- **Sensitive fields:** Lock codes and Wi-Fi passwords are AES-256 encrypted at rest and never returned in standard API responses. Decryption requires an explicit reveal action, which logs who accessed what and when.
- **Query scoping:** All API queries are automatically filtered to homes the requesting user belongs to via `HomeFilterMixin`.
- **Roles:** 4-tier per-home role system — Owner, Admin, Manager, Viewer.

---

## Documentation

| Doc | Description |
|-----|-------------|
| [docs/prd.md](docs/prd.md) | Full product requirements (v3) |
| [docs/schema.sql](docs/schema.sql) | Database schema |
| [docs/api-endpoints.md](docs/api-endpoints.md) | REST API reference |
| [docs/architecture.md](docs/architecture.md) | System architecture |
| [docs/phase-plan.md](docs/phase-plan.md) | 6-phase development plan |

---

## Development Status

| Phase | Scope | Status |
|-------|-------|--------|
| 1 | Foundation — Django scaffold, auth, homes, permissions | Not started |
| 2 | Task management + Calendar | Not started |
| 3 | Estate features — people, vendors, maintenance, home info | Not started |
| 4 | Communication — activity log, bulletins, protocols, documents | Not started |
| 5 | Next.js frontend | Not started |
| 6 | Polish + deploy | Not started |
