# MiHomes — Development Phase Plan

Total estimated duration: ~6 weeks across 5 phases.
One codebase, one language (TypeScript), one deployment.

---

## Phase 1: Foundation (Week 1)

**Goal:** Working app shell — auth, homes, permissions, global layout.

- [ ] Next.js 14 project scaffold (App Router, TypeScript, Tailwind CSS)
- [ ] Prisma + SQLite setup (`prisma init`, `DATABASE_URL=file:./dev.db`)
- [ ] `User`, `Account`, `Session` models
- [ ] NextAuth.js credentials provider (username + password, bcrypt)
- [ ] Register page + login page
- [ ] `Home` + `HomeMember` models + migrations
- [ ] `src/lib/prisma.ts` — Prisma client singleton
- [ ] `src/lib/auth.ts` — NextAuth config
- [ ] `src/lib/permissions.ts` — `requireSession()`, `requireHomeMember()`, `requireHomeRole()`
- [ ] `src/actions/auth.ts` — register, updateProfile, changePassword
- [ ] `src/actions/homes.ts` — CRUD + members
- [ ] Global layout: sidebar, topbar, home selector dropdown
- [ ] Overview page shell (home summary cards)

**Phase 1 Deliverable:** Can register, log in, create homes, add members, assign roles. Layout renders. All data scoped to authenticated user.

---

## Phase 2: Task Management + Calendar (Week 2)

**Goal:** Full task board, list view, calendar, and completion logs.

- [ ] `Task` + `TaskAssignee` models + migrations
- [ ] `src/actions/tasks.ts` — CRUD + move (status update)
- [ ] Kanban board page (`/tasks`) — drag-and-drop columns
- [ ] Task list page — sortable table, active/completed tabs
- [ ] Board / List view toggle
- [ ] Task create/edit modal (title, description, home, assignees, priority, dates)
- [ ] `Event` model + migrations
- [ ] `src/actions/events.ts` — CRUD + `getCalendarData`
- [ ] Calendar page (`/calendar`) — monthly grid, task pins + event blocks, color-coded by home
- [ ] Event create/edit modal
- [ ] `CompletionLog` model + migrations
- [ ] `src/actions/completion-logs.ts` — create, list, delete
- [ ] `<CompletionLog>` reusable component (collapsed/expanded, add form, reverse chronological)
- [ ] Completion logs wired to events

**Phase 2 Deliverable:** Tasks fully manageable in kanban and list views. Calendar renders events + tasks. CompletionLog component reusable.

---

## Phase 3: Estate Features (Weeks 3–4)

**Goal:** People, vendors, maintenance, all 8 home info sections, sensitive field security.

### Week 3 — People + Vendors + Maintenance
- [ ] `Person` model + migrations
- [ ] `src/actions/people.ts` — CRUD + `searchPeople` (for @mention autocomplete)
- [ ] People page (`/people`) — card grid, role filter tabs, add/edit modal
- [ ] `Vendor` + `VendorHome` models + migrations
- [ ] `src/actions/vendors.ts` — CRUD, multi-home tagging
- [ ] Vendors page (`/vendors`) — card grid, home filter, add/edit modal
- [ ] `MaintenanceTask` model + migrations
- [ ] `src/actions/maintenance.ts` — CRUD + computed status
- [ ] Dynamic status helper: `overdue` / `due_soon` / `on_track` / `no_schedule`
- [ ] `nextDue` auto-recalculation on completion log add/delete
- [ ] Maintenance page — status pills, completion log per task

### Week 4 — Home Info Sections + Security
- [ ] All 8 home info models + migrations:
  `ServiceProvider`, `LockCode`, `InternetNetwork`, `ApplianceWarranty`,
  `ImportantContact`, `UtilityBill`, `SmartHomeSystem`, `EmergencyInfo`
- [ ] `src/lib/encryption.ts` — `encryptField()` / `decryptField()` (AES-256-GCM)
- [ ] `AccessLog` model + migrations (read-only — no update/delete in actions)
- [ ] `src/actions/home-info.ts` — CRUD for all 8 sections
- [ ] `revealLockCode(id)` — decrypt + write AccessLog + return `{ value, maskAfter }`
- [ ] `revealWifiPassword(id)` — same pattern
- [ ] `<SecureCode>` component — masked display, reveal button, 30s auto-hide timer, clipboard copy
- [ ] Home detail page (`/homes/[id]`) — pill/tab navigation, all 8 sections
- [ ] Completion logs wired to all 8 sections

**Phase 3 Deliverable:** All estate data manageable. Lock codes + Wi-Fi passwords encrypted, access logged, masked in UI.

---

## Phase 4: Communication (Week 5)

**Goal:** Activity log, bulletins, protocols, lists, documents, notifications.

- [ ] `ActivityLog` model + migrations
- [ ] `src/actions/activity.ts` — create (with @mention parsing), list, delete
- [ ] @mention parsing: extract `@Name` → resolve to Person/Vendor → store structured data
- [ ] Activity log page — @mention badge rendering (blue = vendor, pink = person)
- [ ] `Bulletin` model + migrations
- [ ] `src/actions/bulletins.ts` — CRUD + notify all home members on create
- [ ] Bulletin board UI on overview dashboard
- [ ] `Protocol` model + migrations
- [ ] `src/actions/protocols.ts` — CRUD + completion log
- [ ] Protocols page
- [ ] `List` + `ListItem` models + migrations
- [ ] `src/actions/lists.ts` — CRUD + toggle done
- [ ] Lists page — interactive checkboxes, progress indicator
- [ ] `Document` model + migrations
- [ ] `src/actions/documents.ts` — upload (FormData), list, delete
- [ ] Documents page — table view, upload form, download links
- [ ] `Notification` model + migrations
- [ ] `src/actions/notifications.ts` — create (internal), list, markRead, markAllRead
- [ ] Notification bell in topbar (unread badge, dropdown)
- [ ] Notification triggers wired into relevant actions
- [ ] `GET /api/cron/notifications` route — daily checks (maintenance, warranties, task due dates, event reminders)
- [ ] Access log page (owner/admin only, under home settings)

**Phase 4 Deliverable:** Full communication layer. All notifications working. Every feature complete.

---

## Phase 5: Polish + Deploy (Week 6)

**Goal:** Tested, production-ready, deployed.

- [ ] Test coverage:
  - Auth (register, login, session)
  - Permission matrix (all 4 roles × sensitive actions)
  - Sensitive field reveal + access logging
  - Completion log + nextDue recalculation
  - Notification triggers
- [ ] E2E tests (Playwright): happy paths for each major feature
- [ ] Security checklist:
  - No encrypted fields in standard responses
  - Cross-home scoping verified (attempt to access another home's data returns 403)
  - Role enforcement per action
- [ ] Production environment variables set
- [ ] SQLite WAL mode enabled (`PRAGMA journal_mode=WAL`)
- [ ] Daily SQLite backup (cron → copy `dev.db` to backup location)
- [ ] Deploy to Vercel or Railway
- [ ] Domain setup (mihomes.app)
- [ ] Error tracking (Sentry)

**Phase 5 Deliverable:** Production-ready MiHomes — deployed, monitored, backed up.

---

## Tech Decisions Log

| Decision | Rationale |
|----------|-----------|
| Next.js only (no separate backend) | One codebase, one language, one deploy — maximally AI-friendly |
| Server actions over REST API | No HTTP layer to design; type-safe end-to-end; less surface area |
| Prisma over raw SQL | Declarative schema, auto-generated types, migration tooling |
| SQLite | Zero infrastructure, zero config, perfect for 4 concurrent users |
| NextAuth credentials | Simple username/password to start; swap provider later without changing the rest of the app |
| AES-256-GCM in `src/lib/encryption.ts` | Standard Node crypto, no extra dependency |
| Synchronous notification triggers | No background worker needed at this scale; simpler, fewer moving parts |
| Vercel Cron for daily checks | Free tier covers daily frequency; zero additional infrastructure |
