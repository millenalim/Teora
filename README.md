# MiHomes

MiHomes is a centralized estate management platform for teams managing multiple residential properties. Built as a single Next.js app — no separate backend, no API layer.

---

## What it does

- **Tasks & Kanban** — built-in kanban board and sortable list view with drag-and-drop
- **Calendar** — monthly grid with events and tasks, color-coded by home
- **Maintenance** — recurring task tracking with dynamic status and auto-calculated next due dates
- **Home Info** — secure storage for lock codes, Wi-Fi passwords, appliance warranties, utility bills, smart home systems, emergency info, and more
- **People & Vendors** — directory of residents, staff, contacts, and service vendors
- **Collaboration** — activity log with @mentions, bulletin board, protocols, and checklists
- **Documents** — file upload and management per home
- **Notifications** — in-app alerts for overdue maintenance, expiring warranties, assigned tasks, and more

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | SQLite via Prisma ORM |
| Auth | NextAuth.js (credentials provider) |
| Styling | Tailwind CSS |
| Hosting | Vercel or Railway |

---

## Project Structure

```
mihomes/
├── prisma/schema.prisma     # All models
├── src/
│   ├── app/                 # Pages (App Router)
│   ├── actions/             # Server actions
│   ├── components/          # React components
│   ├── lib/                 # prisma, auth, permissions, encryption
│   └── types/
├── uploads/                 # Uploaded files
└── docs/                    # Reference docs
```

---

## Getting Started

> Prerequisites: Node 20+

```bash
npm install
cp .env.example .env
npx prisma migrate dev
npm run dev
```

### Environment Variables (`.env`)

```
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET=          # random string, min 32 chars
NEXTAUTH_URL="http://localhost:3000"
ENCRYPTION_KEY=           # 32-byte hex string for AES-256
```

---

## Tests

```bash
npm test            # unit tests
npm run test:e2e    # Playwright E2E
```

## Linting

```bash
npm run lint
```

---

## Security Notes

- **Sensitive fields:** Lock codes and Wi-Fi passwords are AES-256 encrypted at rest. Never returned in standard reads — requires an explicit reveal action that logs who accessed what and when.
- **Query scoping:** All server actions scope data to the requesting user's homes. Cross-home access is blocked at the action level.
- **Roles:** 4-tier per-home role system — Owner, Admin, Manager, Viewer.

---

## Documentation

| Doc | Description |
|-----|-------------|
| [docs/prd.md](docs/prd.md) | Full product requirements |
| [docs/schema.prisma](docs/schema.prisma) | Prisma schema reference |
| [docs/api-endpoints.md](docs/api-endpoints.md) | Server actions reference |
| [docs/architecture.md](docs/architecture.md) | System architecture |
| [docs/phase-plan.md](docs/phase-plan.md) | 5-phase, 6-week development plan |

---

## Development Status

| Phase | Scope | Status |
|-------|-------|--------|
| 1 | Foundation — scaffold, auth, homes, permissions | Not started |
| 2 | Task management + Calendar | Not started |
| 3 | Estate features — people, vendors, maintenance, home info | Not started |
| 4 | Communication — activity, bulletins, protocols, documents | Not started |
| 5 | Polish + deploy | Not started |
