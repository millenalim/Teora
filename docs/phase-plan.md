# MiHomes — Development Phase Plan

Total estimated duration: ~9 weeks across 6 phases.
Each phase ends with a working, testable increment.

---

## Phase 1: Foundation (Week 1)

**Goal:** Working Django backend — auth, homes, and permission system.

- [ ] Django 5.1 project scaffold with split settings (base / dev / prod)
- [ ] SQLite database configuration
- [ ] Custom User model (username, email, full name, avatar URL)
- [ ] JWT auth via SimpleJWT: register, login, token refresh, me, logout
- [ ] Home model + CRUD API (`/api/v1/homes/`)
- [ ] HomeMember model + members API (`/homes/{id}/members/`)
- [ ] 4-tier role system: owner, admin, manager, viewer
- [ ] `HomeFilterMixin` — auto-scope all querysets to user's homes
- [ ] Role permission classes: `IsHomeOwner`, `IsHomeAdmin`, `IsHomeManager`, `IsHomeMember`
- [ ] `TimestampMixin` for created_at / updated_at
- [ ] `.env` setup + `django-environ` config

**Phase 1 Deliverable:** Can register, login, create homes, add members, assign roles. All API responses scoped to the authenticated user's homes.

---

## Phase 2: Task Management + Calendar (Week 2)

**Goal:** Full task and event management with kanban, list, and calendar views.

- [ ] Task model + CRUD API (`/api/v1/tasks/`)
- [ ] TaskAssignee M2M (tasks assigned to People)
- [ ] Kanban endpoint: tasks grouped by status (`todo`, `inprogress`, `review`, `done`)
- [ ] Task list endpoint: sortable + filterable (`?status=`, `?priority=`, `?completed=`)
- [ ] `PATCH /tasks/{id}/move/` — update status (drag-and-drop support)
- [ ] Event model + CRUD API (`/api/v1/events/`)
- [ ] Calendar endpoint (`/api/v1/calendar/`) — merged tasks + events for a date range
- [ ] `CompletionLog` model in `shared/models.py` (polymorphic: entity_type + entity_id)
- [ ] Completion Log API (`/api/v1/completion-logs/`) — create, list, delete
- [ ] Completion logs wired to events (track each occurrence)

**Phase 2 Deliverable:** Tasks fully manageable; events created; calendar returns merged view; completion logs working.

---

## Phase 3: Estate Features (Weeks 3–4)

**Goal:** People, vendors, maintenance, all 8 home info sections, and sensitive field security.

### Week 3 — People + Vendors + Maintenance
- [ ] People model + API (`/api/v1/people/`)
- [ ] People mentions endpoint (`/people/mentions/?home_id=&q=`) for @mention autocomplete
- [ ] Vendor model + VendorHome M2M + API (`/api/v1/vendors/`)
- [ ] Maintenance task model + API (`/api/v1/maintenance/`)
- [ ] Dynamic status computation: `overdue`, `due_soon`, `on_track`, `no_schedule`
- [ ] Completion logs wired to maintenance: `next_due` auto-recalculates on log add/delete
- [ ] Frequency → next_due calculation helper (weekly, biweekly, monthly, etc.)
- [ ] Daily management command: `check_maintenance` (creates notifications for overdue + due soon)

### Week 4 — Home Info Sections + Security
- [ ] Service providers model + API
- [ ] Lock codes model + API (code field excluded from all standard responses)
- [ ] `POST /lock-codes/{id}/reveal/` — decrypt + return code; write access log; manager+ only
- [ ] AES-256 field encryption via `django-encrypted-model-fields`
- [ ] `AccessLog` model — read-only, no update/delete exposed
- [ ] Internet & network model + API (Wi-Fi password same security pattern)
- [ ] `POST /network/{id}/reveal/` for Wi-Fi password
- [ ] Appliance warranties model + API
- [ ] Daily management command: `check_warranties` (notifications at 30 and 7 days)
- [ ] Important contacts model + API
- [ ] Utility bills model + API
- [ ] Smart home systems model + API
- [ ] Emergency info model + API
- [ ] Completion logs wired to all 8 sections

**Phase 3 Deliverable:** All estate data fully manageable; sensitive fields encrypted; access logging in place; maintenance and warranty alerts firing.

---

## Phase 4: Communication (Week 5)

**Goal:** Activity log with @mentions, bulletins, protocols, lists, documents, notifications.

- [ ] ActivityLog model + API (`/api/v1/activity/`)
- [ ] @mention parsing: extract `@Name` from content → resolve to Person or Vendor ID → store structured mention data
- [ ] Bulletin model + API (`/api/v1/bulletins/`) + @mentions
- [ ] Bulletin posted notification trigger
- [ ] @mention notification trigger (fire on activity log create)
- [ ] Protocol model + API (`/api/v1/protocols/`) + completion log
- [ ] List + ListItem model + API (`/api/v1/lists/`) with toggle-done
- [ ] Document model + file upload API (`/api/v1/documents/`) — multipart/form-data
- [ ] Files stored under `media/documents/{home_id}/`
- [ ] Notification model + API (`/api/v1/notifications/`) — list, mark read, mark all read
- [ ] Remaining daily management commands: task due-date alerts (3 days), event reminders (1 day)
- [ ] Access log API (`/api/v1/access-logs/`) — read-only, owner/admin only

**Phase 4 Deliverable:** Full communication layer; all notifications working; documents uploadable; all backend features complete.

---

## Phase 5: Frontend (Weeks 6–8)

**Goal:** Complete Next.js web UI connected to the API.

### Week 6 — Auth + Shell + Overview + Tasks
- [ ] Next.js 14 project scaffold (App Router) + Tailwind CSS
- [ ] Auth flow: login page, register page, JWT storage, auto-refresh, protected routes
- [ ] Global layout: sidebar nav, top bar with global home selector dropdown, notification bell
- [ ] Overview dashboard: home summary cards, bulletin board, upcoming tasks panel, recent activity panel
- [ ] Tasks page: Board/List toggle
- [ ] Kanban board (drag-and-drop columns → PATCH `/tasks/{id}/move/`)
- [ ] Task list (sortable table, active/completed tabs)
- [ ] Task create/edit modal

### Week 7 — Calendar + People + Vendors + Maintenance + Documents
- [ ] Calendar page: monthly grid, tasks as yellow pins, events as color-coded blocks
- [ ] Event create/edit modal with `CompletionLog` component
- [ ] People directory (card grid, role filter tabs, add/edit modal)
- [ ] Vendor directory (card grid, home filter, add/edit modal)
- [ ] Maintenance page with dynamic status pills
- [ ] Documents page (table view, upload form, download links)

### Week 8 — Home Info + Communication
- [ ] Home detail page with pill/tab navigation across all 8 sections
- [ ] All 8 home info section UIs with add/edit modals
- [ ] `CompletionLog` reusable component (collapsed "▸ History (3)", expandable, add form, delete per entry)
- [ ] `SecureCode` component: masked display, reveal button, 30s auto-hide timer, clipboard copy (no visual reveal)
- [ ] Wi-Fi password UI (same `SecureCode` component)
- [ ] Activity log page (@mention badge rendering, add entry form)
- [ ] Bulletin board UI + @mention rendering
- [ ] Protocols page + Lists (checklists with interactive checkboxes + progress indicator)
- [ ] Notification dropdown (mark read, mark all read)
- [ ] Access log page (owner/admin only, under home settings)

**Phase 5 Deliverable:** Fully functional web app — all features usable through the UI.

---

## Phase 6: Polish + Deploy (Week 9)

**Goal:** Tested, secure, and deployed to production.

- [ ] Backend test suite (Django TestCase; real SQLite DB, no mocks)
  - Auth endpoints
  - Home + membership + role permission matrix
  - Sensitive field reveal + access logging
  - Completion log + next_due recalculation
  - Notification triggers
- [ ] Frontend: component tests + E2E (Playwright)
- [ ] Security checklist:
  - No sensitive fields in standard API responses
  - Cross-home scoping verified for all endpoints
  - JWT expiry + refresh flow tested
  - Role permission enforcement tested per endpoint
  - Encryption at rest verified
- [ ] Production Django settings (DEBUG=False, ALLOWED_HOSTS, HTTPS, secure cookies)
- [ ] SQLite WAL mode enabled for concurrent reads
- [ ] Daily SQLite backup script
- [ ] Deployment to Railway or VPS
- [ ] Next.js production build + deploy
- [ ] Domain setup (mihomes.app)
- [ ] Error tracking (Sentry)

**Phase 6 Deliverable:** Production-ready MiHomes — deployed, tested, monitored.

---

## Priority Reference

| Label | Meaning |
|-------|---------|
| P0 | Launch — Phases 1–4 (backend) |
| P1 | Core — Phase 5 (frontend) |
| P2 | Enhance — post-launch features |
| P3 | Polish — future nice-to-haves |

## Tech Decisions Log

| Decision | Rationale |
|----------|-----------|
| SQLite over PostgreSQL | Zero infrastructure, zero config, sufficient for 4 concurrent users |
| SimpleJWT over OAuth | No external dependencies; straightforward username/password to start |
| Single `completion_logs` table (polymorphic) | Avoids 9+ duplicate tables; efficient with composite index on (entity_type, entity_id) |
| `django-encrypted-model-fields` | Transparent AES-256 without custom query rewrites |
| POST reveal endpoint over query param | Cleaner audit trail — a POST is an intentional action, not a side effect of a GET |
| Django management commands for notifications | No background worker needed at this scale; run via cron |
