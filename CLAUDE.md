# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**MiHomes** is a centralized estate management platform for teams managing multiple residential properties. Built as a single Next.js app — no separate backend, no API layer.

- **Target users:** 4 team members managing 4 homes
- **Platform:** Web (Next.js) → Mobile (React Native, future)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | SQLite via Prisma ORM |
| Auth | NextAuth.js (credentials provider) |
| Styling | Tailwind CSS |
| Hosting | Vercel or Railway |

## Repo Structure

```
mihomes/
├── prisma/
│   └── schema.prisma        # All models — single source of truth
├── src/
│   ├── app/                 # Pages (App Router)
│   ├── actions/             # Server actions (all data mutations)
│   ├── components/          # React components
│   ├── lib/                 # prisma.ts, auth.ts, permissions.ts, encryption.ts
│   └── types/
├── uploads/                 # Uploaded files (gitignored)
├── docs/                    # Reference docs
├── .env
└── package.json
```

## Key Docs

- Product requirements: `docs/prd.md`
- Prisma schema reference: `docs/schema.prisma`
- Server actions reference: `docs/api-endpoints.md`
- Architecture: `docs/architecture.md`
- Phase plan: `docs/phase-plan.md`

## Getting Started

```bash
npm install
cp .env.example .env        # fill in secrets
npx prisma migrate dev
npm run dev
```

## Tests

```bash
npm test                    # unit tests
npm run test:e2e            # Playwright E2E
```

## Linting

```bash
npm run lint
```

## Development Notes

- All data mutations go through server actions in `src/actions/` — never raw Prisma calls in components
- All actions call `requireSession()` and `requireHomeMember()` before touching data — no exceptions
- Sensitive fields (lock codes, Wi-Fi passwords) are AES-256 encrypted via `src/lib/encryption.ts` — never returned in standard reads
- Completion logs use a polymorphic pattern: single `CompletionLog` model with `entityType` + `entityId`
- `nextDue` on `MaintenanceTask` recalculates automatically when a completion log is added or deleted
- Notification triggers fire synchronously inside the relevant server action
- Daily notification checks run via `GET /api/cron/notifications`
