# Teora — Development Phase Plan

Total estimated duration: ~17 weeks across 6 phases.
Each phase ends with a working, deployable increment.

---

## Phase 1: Foundation + Microsoft Integration (Weeks 1–3)

**Goal:** Working backend with Microsoft SSO, Planner sync, and Outlook Calendar sync.

### Week 1 — Django Scaffold + Auth
- [ ] Django 5.1 project scaffold with split settings (base / dev / prod)
- [ ] PostgreSQL connection + initial migrations
- [ ] Redis connection (Channels + Celery)
- [ ] Azure AD app registration (OAuth 2.0, required scopes)
- [ ] Microsoft SSO login flow (`/auth/microsoft/login/` + `/callback/`)
- [ ] User model + `user_tokens` table (encrypted token storage)
- [ ] JWT issuance (access: 30 min, refresh: 7 days)
- [ ] `HomeFilterMixin` + role permission classes
- [ ] `HomeRole` model + `home_memberships`
- [ ] Django Channels setup (ASGI + Redis layer)
- [ ] Celery + Beat setup

### Week 2 — Homes + Planner Sync
- [ ] Home model + CRUD API (`/api/v1/homes/`)
- [ ] Home members API (`/homes/{id}/members/`)
- [ ] M365 Group auto-provisioning on home creation (Graph API)
- [ ] `GraphClient` wrapper (token refresh, retry, rate-limit handling)
- [ ] Planner plan auto-creation per home
- [ ] Task model + `task_assignees`
- [ ] Planner bidirectional sync:
  - Create/update/delete in Teora → Planner
  - Graph webhook → Teora DB update
  - 5-minute polling fallback (Celery)
- [ ] Tasks API (`/api/v1/tasks/`) — list, create, update, delete, move
- [ ] Kanban status mapping: Planner buckets ↔ Teora status enum

### Week 3 — Outlook Calendar Sync + Completion Log Core
- [ ] Event model
- [ ] Outlook Group Calendar bidirectional sync:
  - Create/update/delete in Teora → Outlook
  - Graph webhook → Teora DB update
- [ ] Events API (`/api/v1/events/`)
- [ ] `completion_logs` table + polymorphic model
- [ ] Completion Log API (`/api/v1/completion-logs/`)
- [ ] Graph webhook subscription registration + renewal (Celery task)
- [ ] Railway deploy: Django + PostgreSQL + Redis (dev environment)

**Phase 1 Deliverable:** Team can log in with Microsoft, create homes linked to M365 Groups, manage tasks synced with Planner, and create events synced with Outlook Calendar.

---

## Phase 2: Core Estate Features (Weeks 4–6)

**Goal:** Full estate data management — people, vendors, maintenance, all home info sections, and sensitive field security.

### Week 4 — People + Vendors + Maintenance
- [ ] People model + API (`/api/v1/people/`)
- [ ] Vendor model + `vendor_homes` M2M + API (`/api/v1/vendors/`)
- [ ] Maintenance task model + API (`/api/v1/maintenance/`)
- [ ] Dynamic status calculation (`next_due` vs today → overdue/due soon/on track/no schedule)
- [ ] Completion log wired to maintenance: next_due auto-recalculates on log add/delete
- [ ] Celery Beat: daily maintenance overdue + due-soon checks
- [ ] Planner task auto-creation when maintenance due within 7 days

### Week 5 — Home Info Sections
- [ ] Service providers model + API
- [ ] Lock codes model + API (masked by default; `?reveal=true` path)
- [ ] AES-256 field encryption (lock codes, Wi-Fi passwords)
- [ ] `access_logs` table + log-on-reveal logic
- [ ] Internet & network model + API (Wi-Fi password security same pattern)
- [ ] Appliance warranties model + API + Celery expiration alerts (30/7 days)
- [ ] Important contacts model + API
- [ ] Utility bills model + API
- [ ] Smart home systems model + API
- [ ] Emergency info model + API
- [ ] Completion logs wired to all 8 sections

### Week 6 — Documents + Security Polish
- [ ] Documents model + SharePoint upload API
- [ ] SharePoint document library provisioning per home (Graph)
- [ ] `HomeFilterMixin` verified across all viewsets (no cross-home leakage)
- [ ] Auto-mask: 30s timer on revealed fields (backend sends TTL in response)
- [ ] Session timeout flag: 5-min inactivity → all reveals invalidated
- [ ] Role permission enforcement verified across all endpoints
- [ ] API test coverage for sensitive field paths

**Phase 2 Deliverable:** Complete data management for all estate sections with security controls in place.

---

## Phase 3: Collaboration + Communication (Weeks 7–8)

**Goal:** Activity log (real-time), bulletins, notifications, protocols, lists.

### Week 7 — Real-Time Collaboration
- [ ] Activity log model + API + WebSocket consumer (`activity_{home_id}` channel)
- [ ] @mention parsing: extract `@Name` → resolve to person/vendor ID → store as structured data
- [ ] Bulletin board model + API + @mentions
- [ ] Notification model + in-app notification API
- [ ] WebSocket consumer for notifications (`notifications_{user_id}` channel)
- [ ] Celery notification dispatch (triggered by maintenance/warranty/task checks)
- [ ] Bulletin posted notification + @mention notification triggers

### Week 8 — Protocols + Lists + Sync Polish
- [ ] Protocols model + API + completion log
- [ ] Lists + list items model + API (toggle done persists immediately)
- [ ] Celery Beat: task due-date alerts (3 days), event reminders (1 day)
- [ ] Graph webhook renewal (subscriptions expire every 3 days for some resources)
- [ ] Error handling: Graph unavailable → queue writes, retry on reconnect

**Phase 3 Deliverable:** Real-time team collaboration, full notification system, all communication features.

---

## Phase 4: Next.js Frontend — Web App (Weeks 9–11)

**Goal:** Complete web UI connected to the API.

### Week 9 — Auth + Shell + Overview
- [ ] Next.js 14 project (App Router) setup + Vercel deploy
- [ ] Microsoft SSO auth flow (MSAL.js or NextAuth with Azure AD provider)
- [ ] JWT storage + auto-refresh
- [ ] Global layout: sidebar nav, top bar, global home selector dropdown
- [ ] Overview dashboard: home summary cards, bulletin board, upcoming tasks, recent activity
- [ ] Notification bell with unread count badge; notification dropdown
- [ ] WebSocket client setup (activity + notification channels)

### Week 10 — Tasks + Calendar + Documents + People + Vendors
- [ ] Kanban board view (drag-and-drop columns → PATCH `/tasks/{id}/move/`)
- [ ] Task list view (sortable, active/completed tabs)
- [ ] Task create/edit modal (assignees, dates, priority, description)
- [ ] Monthly calendar grid view (events + task pins, color-coded by home)
- [ ] Event create/edit modal with completion log component
- [ ] Documents table view + upload flow (SharePoint link-out)
- [ ] People directory (card grid, role filter tabs, add/edit modal)
- [ ] Vendor directory (card grid, home filter, add/edit modal)

### Week 11 — Home Details + All Sections + Lock Code UI
- [ ] Home detail page with section pill navigation
- [ ] All 8 home info section UIs with add/edit modals
- [ ] Reusable `CompletionLog` component (collapsed/expanded, add form, entry list)
- [ ] Lock code UI: masked display, reveal button, 30s auto-hide timer, clipboard copy (no visual reveal)
- [ ] Wi-Fi password UI (same pattern as lock codes)
- [ ] Maintenance section UI with dynamic status pills
- [ ] Activity log UI + @mention rendering (colored badges) + real-time updates
- [ ] Bulletin board UI + @mentions
- [ ] Protocols UI + Lists UI with interactive checkboxes

**Phase 4 Deliverable:** Fully functional web app — all features usable through the UI.

---

## Phase 5: Enhanced Features (Weeks 12–14)

**Goal:** P2 features — expense tracking, work orders, templates, key dates.

### Week 12 — Expense Tracking
- [ ] Expense model: date, amount, category, vendor, receipt (SharePoint), notes, home
- [ ] Expense API + frontend table/dashboard view
- [ ] Budget model per home; alert when approaching limit
- [ ] Dashboard widgets: monthly spend by home, spend by category, YoY comparison
- [ ] CSV/Excel export for tax prep
- [ ] Pull cost data from completion logs (auto-import costs already logged)

### Week 13 — Work Order System + Key Date Tracker
- [ ] Work order model: vendor, home, status flow, quote/final cost, invoice #
- [ ] Work order API + status transition logic
- [ ] SharePoint attachment support (quotes, invoices, photos)
- [ ] Auto-create Planner task on work order approval
- [ ] Key date tracker model: category, date, home, notes
- [ ] Key date API + Celery alerts at 60/30/7 days
- [ ] Outlook Calendar integration for key dates
- [ ] Frontend: work order board + key date tracker view

### Week 14 — Seasonal Templates + Vendor Comparison
- [ ] Task template model: title, task list, home, deploy-to date
- [ ] Template library (pre-built: Winter Prep, Spring Opening, etc.)
- [ ] One-click deploy: template → Planner tasks with dates
- [ ] Vendor comparison view (`/vendors/compare/?ids=...`)
- [ ] Global search (Postgres full-text search across all models)

**Phase 5 Deliverable:** Full P2 feature set — expense tracking, work orders, seasonal templates, key dates, vendor comparison, global search.

---

## Phase 6: Mobile + Polish + Deployment (Weeks 15–17)

**Goal:** React Native app, audit trail, testing, security audit, production deploy.

### Week 15 — React Native App
- [ ] Expo project setup (shared API with web)
- [ ] Microsoft SSO flow on mobile (MSAL React Native)
- [ ] Mobile quick actions:
  - Pull up lock codes + Wi-Fi in 2 taps
  - Photo + note → activity log entry
  - Voice-to-task → Planner task
  - Tap-to-call from vendor/people directory
- [ ] Core screens: overview, tasks, calendar, maintenance, home info sections
- [ ] Push notifications (FCM/APNs via Expo)
- [ ] iOS + Android builds via EAS Build

### Week 16 — Audit Trail + Property Comparison
- [ ] Audit trail: auto-log all CRUD events (who, what changed, old→new value, when)
- [ ] Audit trail read-only API + UI (per entity + global view)
- [ ] Property comparison dashboard (2–4 homes side-by-side, metrics + expense trends)
- [ ] Guest & visitor management (guest log, access instruction auto-generation)

### Week 17 — Testing + Security Audit + Production
- [ ] Backend: full test suite (unit + integration; real DB, no mocks)
- [ ] Frontend: component tests + E2E (Playwright or Cypress)
- [ ] Security audit:
  - Verify no sensitive fields in standard API responses
  - Cross-home query scoping tests
  - JWT expiry + refresh tests
  - Role permission matrix tests
  - Encryption at rest verification
- [ ] Load testing (target: < 500ms p95 at 50 concurrent users)
- [ ] Production Railway deploy (env vars, DB migrations, Celery workers)
- [ ] Vercel production deploy
- [ ] Domain setup (teora.app → Vercel + Railway)
- [ ] Monitoring: error tracking (Sentry), uptime alerts

**Phase 6 Deliverable:** Production-ready Teora — web + mobile, tested, secured, deployed.

---

## Priority Reference

| Label | Meaning |
|-------|---------|
| P0 | Launch — must ship in Phases 1–3 |
| P1 | Core — must ship before Phase 4 frontend |
| P2 | Enhance — Phase 5 |
| P3 | Polish — Phase 6 |

## Tech Decisions Log

| Decision | Rationale |
|----------|-----------|
| Single `completion_logs` table (polymorphic) | Avoids 9+ duplicate tables; efficient with composite index |
| Sync-on-write to Graph | Keeps Teora and M365 immediately consistent; webhook covers reverse direction |
| Railway for backend | Simple Docker deploys, managed Postgres + Redis in one platform |
| Vercel for Next.js | Zero-config, edge-optimized, free tier sufficient |
| `django-encrypted-model-fields` | Transparent AES-256 without custom query rewrites |
| No local passwords | Microsoft SSO only — eliminates credential management entirely |
