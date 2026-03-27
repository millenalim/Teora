# Teora — Product Requirements Document v3

## Product Vision

Teora is a centralized estate management platform for teams managing multiple residential properties. It provides built-in task management, scheduling, and estate-specific features — giving property teams a single place to organize tasks, people, vendors, maintenance, and critical home information across all properties.

**Name:** Teora
**Target Users:** 4 team members managing 4 homes
**Platform:** Web (Next.js) → Mobile (React Native, future)

---

## TECH STACK

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | SQLite via Prisma ORM |
| Auth | NextAuth.js (credentials provider) |
| Styling | Tailwind CSS |
| File Storage | Local filesystem |
| Hosting | Vercel or Railway |

---

## FEATURE INVENTORY

---

### 1. Authentication & Users

#### 1a. Simple Auth
- Username + password registration and login
- Django built-in auth with JWT tokens via SimpleJWT
- Access token (30 min) + refresh token (7 days)
- No third-party OAuth — straightforward credentials

#### 1b. Role System
- 4-tier roles per home:

| Role | View | Edit | Manage members | Delete home |
|------|------|------|----------------|-------------|
| Owner | yes | yes | yes | yes |
| Admin | yes | yes | yes | no |
| Manager | yes | yes | no | no |
| Viewer | yes | no | no | no |

#### 1c. User Profile
- Fields: username, email, full name, avatar URL
- Update name, email, password via profile page
- All querysets auto-scoped to user's homes via HomeFilterMixin

---

### 2. Property Management

#### 2a. Home Profiles
- 4 homes, each with: name, address, square footage, lot size, purpose/description, color tag
- Overview dashboard cards showing task/vendor/event counts per home
- Edit via modal

#### 2b. Home Purpose
- Each home has a defined purpose (e.g., "Primary residence," "Vacation rental," "Under renovation")
- Visible on overview card

#### 2c. Global Property Filter
- Dropdown in top nav: "All Properties" or select one home
- Applies across all views

---

### 3. Task Management (Built-In)

#### 3a. Kanban Board View
- 4 columns: To Do, In Progress, Review, Done
- Drag-and-drop between columns
- Each task card shows: title, description preview, home pill (color-coded), priority pill, assignees, date range
- Filtered by selected home

#### 3b. Task List View
- Sortable table with columns: subject, start date, end date, priority, status, property, assignees
- Active / Completed tabs
- Click any column header to sort

#### 3c. Task Fields
- Title (required)
- Description
- Home (required)
- Assignees (multi-select from people)
- Priority: High, Medium, Low
- Status: To Do, In Progress, Review, Done
- Start date (optional)
- End date (optional)

#### 3d. Toggle
- Switch between Board and List views with a toggle button

---

### 4. Calendar

#### 4a. Monthly Grid View
- Navigation arrows for month/year
- Today highlighted
- Events span across all days between start and end date (color-coded by home)
- Tasks with dates also appear on calendar (yellow pins)
- Click any event or task to open edit modal

#### 4b. Events
- Fields: title, home, assignee, start date (optional), end date (optional), time, notes
- **Completion log**: tracks every time the event was completed — date, who, cost, notes (see §8)

#### 4c. Quick Add
- "+ Task" and "+ Event" buttons accessible from calendar view

---

### 5. People Management

#### 5a. People Directory
- Three roles: Resident, Staff, Contact
- Filter tabs: All, Resident, Staff, Contact
- Card grid layout
- Fields: name, role, phone, email, company, home assignment, notes
- Avatar circle with initial, color-coded by role
- People feed into: assignee dropdowns, @mention autocomplete, completion log "completed by" fields

---

### 6. Vendor Management

#### 6a. Vendor Directory
- Card grid layout
- Fields: company name, service type, phone, email, website, pricing, quote amount, rating (1–5), notes
- Multi-home tagging via checkboxes
- Home pills displayed on card
- Filter by selected home

---

### 7. Maintenance System

#### 7a. Maintenance Tasks
- Fields: task name, frequency, provider, estimated cost, home, notes
- Frequency options: Weekly, Bi-Weekly, Monthly, Quarterly, Semi-Annually, Annually, As Needed

#### 7b. Dynamic Status Tracking
- Auto-calculated status based on next_due vs today:
  - **Overdue** (red) — past due
  - **Due Soon** (amber) — within 7 days
  - **On Track** (green) — more than 7 days out
  - **No Schedule** (gray) — no next due date set

#### 7c. Completion Log (see §8)
- Each task has expandable completion log
- **Next due date auto-calculates** from last completion + frequency
- Running count of total completions

---

### 8. Completion Log Pattern (Cross-Cutting)

Reusable pattern applied across multiple sections.

#### 8a. Standard Log Fields
Every completion log entry contains:
- **Date** (date picker)
- **Completed by** (dropdown of people)
- **Cost** (optional, free text)
- **Notes** (optional, free text)

#### 8b. UI Behavior
- Collapsed by default: "▸ History (3)" shows count
- Expandable inline with add form at top
- Entries in reverse chronological order
- Each entry individually deletable
- "+ Log" quick action button always visible

#### 8c. Applied To

| Section | What the log tracks |
|---------|-------------------|
| Maintenance tasks | Completions (auto-calculates next due) |
| Events | Each time the event occurred |
| Internet & Network | Service visits, equipment changes |
| Appliance Warranties | Service calls, repairs, claims |
| Important Contacts | Interactions — calls, meetings, renewals |
| Utility Bills | Payments, rate changes, service calls |
| Smart Home Systems | Firmware updates, device changes |
| Emergency Info | Inspections, tests, equipment checks |
| Protocols | Reviews, updates, training sessions |

#### 8d. Database Design
```
completion_logs
  - id (INTEGER, auto PK)
  - entity_type (VARCHAR) — "maintenance", "event", "warranty", etc.
  - entity_id (INTEGER) — FK to parent record
  - home_id (INTEGER) — FK to home
  - completed_date (DATE)
  - completed_by_id (INTEGER, nullable) — FK to people
  - cost (VARCHAR, nullable)
  - notes (TEXT, nullable)
  - created_at (DATETIME, auto)
```
Single table with entity_type + entity_id polymorphic association. Composite index on (entity_type, entity_id).

---

### 9. Home Information Sections (per home)

All sections under "Home Info" tab with pill/tab navigation. Standard CRUD pattern.

#### 9a. Service Providers
- Fields: name, service type, phone, email, notes

#### 9b. Lock & Access Codes 🔒
- Fields: location, code/password, type (smart lock, keypad, gate, garage, lockbox, other), notes
- **Security:**
  - Codes masked by default ("••••••••") in list view
  - Reveal on click with show/hide toggle
  - Auto-hide after 30 seconds
  - Permission-gated: Manager+ can reveal; Viewer sees masked only
  - Backend: encrypted at rest using django-encrypted-model-fields
  - Clipboard copy button (copies without revealing visually)
  - Access logging: every reveal logged (who, what, when) — read-only audit trail

#### 9c. Internet & Network
- Fields: provider, account number, plan details, Wi-Fi name, Wi-Fi password, router IP, notes
- Wi-Fi password follows same security pattern as lock codes
- **Completion log**: service visits, equipment changes

#### 9d. Appliance Warranties
- Fields: appliance, brand, model, serial number, purchase date, warranty expiration, purchased from, notes
- **Completion log**: service calls, repairs, warranty claims

#### 9e. Important Contacts
- Fields: name, type (HOA, Insurance, Mortgage, Pest Control, Landscaping, Pool, Security, Other), phone, email, account number, policy number, notes
- **Completion log**: calls, meetings, renewals

#### 9f. Utility Bills
- Fields: utility type (Electric, Gas, Water, Sewer, Trash, Internet, Solar, Other), provider, account number, avg monthly, due date, autopay (yes/no), notes
- **Completion log**: payments, rate changes, service calls

#### 9g. Smart Home Systems
- Fields: system name, app name, hub/bridge, account email, connected devices, notes
- **Completion log**: firmware updates, device changes, troubleshooting

#### 9h. Emergency Info
- Fields: item, location, details, notes
- **Completion log**: inspections, tests, equipment checks

---

### 10. Communication & Collaboration

#### 10a. Bulletin Board
- Pinned on overview dashboard
- Fields: title, content, home, author, date
- Content supports @mentions (rendered as colored badges)
- Edit/delete per bulletin

#### 10b. Activity Log
- Timestamped feed per home
- @mentions auto-highlight: blue for vendors, pink for people
- Fields: home, author, date, free-text entry
- Newest first
- Delete individual entries

#### 10c. Protocols
- Documented procedures per home
- Fields: title, category (Emergency, Cleaning, Opening/Closing, Security, Guest, Maintenance, Other), home, content, linked document name, last reviewed date
- **Completion log**: reviews, updates, training sessions

#### 10d. Lists (Checklists)
- Standalone checklists per home
- Fields: title, home, items (text + done state)
- Interactive checkboxes
- Progress indicator (3/5 done)

---

### 11. Documents
- Simple file upload and management per home
- Fields: title, category (Contract, Insurance, Manual, Protocol, Receipt, Tax, Other), home, file upload, notes, date
- Store files in Django media directory
- Table view: title, category, home, date, download link

---

### 12. Notification System

#### 12a. Trigger Events

| Trigger | Timing |
|---------|--------|
| Maintenance overdue | next_due < today |
| Maintenance due soon | next_due within 7 days |
| Warranty expiring | 30 and 7 days before |
| Task assigned | Immediately |
| Task due soon | 3 days before end_date |
| Event reminder | 1 day before start_date |
| Bulletin posted | Immediately |
| @mention in activity | Immediately |

#### 12b. Delivery
- In-app notification bell with unread badge count
- Mark as read / mark all as read
- Future: email digest, mobile push

---

### 13. Security

#### 13a. Auth
- Username + password with Django auth
- JWT tokens (30 min access, 7 day refresh)
- 4-tier role system per home

#### 13b. Sensitive Field Encryption
- Lock codes and Wi-Fi passwords: encrypted at rest
- Never in plaintext API responses
- Explicit reveal action with access logging

#### 13c. Access Log
- Every reveal of sensitive field logged: who, what, when
- Read-only — cannot be edited or deleted
- Accessible to owners/admins under home settings

#### 13d. Auto-Scope
- All queries filtered to user's homes at ORM level
- HomeFilterMixin on all viewsets

---

### 14. Overview Dashboard

Landing page after login:
- Home summary cards (name, address, purpose, task/event/maint counts)
- Bulletin board section
- Upcoming tasks panel (top 5 non-done)
- Recent activity panel (last 5 entries)

---

## FUTURE ENHANCEMENTS (P2/P3)

| Priority | Feature |
|----------|---------|
| P2 | Expense tracking + budget dashboard |
| P2 | Vendor work order system |
| P2 | Seasonal task templates |
| P2 | Key date & renewal tracker |
| P2 | Global search / quick find |
| P3 | Audit trail / change history |
| P3 | Property comparison dashboard |
| P3 | Guest & visitor management |
| P3 | Mobile app (React Native) |
| P3 | Email notifications |

---

## FEATURE PRIORITY MATRIX

| Priority | Feature | Effort |
|----------|---------|--------|
| **P0** | Simple auth (username/password + JWT) | Low |
| **P0** | Home profiles + purpose + global filter | Low |
| **P0** | Task management (kanban + list + CRUD) | Medium |
| **P0** | Calendar (monthly grid + events) | Medium |
| **P0** | People management | Low |
| **P0** | Vendor directory | Low |
| **P0** | Maintenance + status + completion logs | Medium |
| **P0** | Home info sections (all 8) + completion logs | Medium |
| **P0** | Lock code security (encryption, masking, access log) | Medium |
| **P1** | Bulletin board + @mentions | Low |
| **P1** | Activity log + @mentions | Medium |
| **P1** | Protocols + completion log | Low |
| **P1** | Lists (checklists) | Low |
| **P1** | Documents (file upload) | Low |
| **P1** | Notification system | Medium |

---

## DEVELOPMENT PHASES

### Phase 1: Foundation (Week 1)
- Next.js 14 project scaffold (App Router + TypeScript + Tailwind)
- Prisma + SQLite setup
- NextAuth credentials (username + password)
- User model + auth pages (login, register)
- Home + HomeMember models + server actions
- Permission helpers (role checks)
- Global layout shell (sidebar, topbar, home selector)

### Phase 2: Task Management + Calendar (Week 2)
- Task + TaskAssignee models + server actions
- Kanban board UI (drag-and-drop)
- Task list UI (sortable, filterable)
- Event model + server actions
- Calendar page (monthly grid, tasks + events)
- CompletionLog model + reusable component

### Phase 3: Estate Features (Weeks 3–4)
- People + Vendor models + server actions + UI
- Maintenance model + dynamic status + completion logs
- All 8 home info sections
- Lock code encryption + masking + access logging
- Wi-Fi password same security pattern

### Phase 4: Communication (Week 5)
- Activity log + @mention parsing + UI
- Bulletin board
- Protocols + completion log
- Lists (checklists)
- Documents (file upload)
- Notification system (in-app bell)

### Phase 5: Polish + Deploy (Week 6)
- Testing
- Production config
- Deploy to Vercel or Railway

---

## PROJECT STRUCTURE

```
teora/
├── prisma/
│   └── schema.prisma        # Single source of truth for all models
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── register/
│   │   └── (dashboard)/
│   │       ├── page.tsx             # Overview
│   │       ├── tasks/
│   │       ├── calendar/
│   │       ├── people/
│   │       ├── vendors/
│   │       ├── maintenance/
│   │       ├── documents/
│   │       ├── activity/
│   │       └── homes/[id]/          # Home detail + all 8 sections
│   ├── actions/                     # Server actions (data mutations)
│   │   ├── auth.ts
│   │   ├── homes.ts
│   │   ├── tasks.ts
│   │   ├── events.ts
│   │   ├── people.ts
│   │   ├── vendors.ts
│   │   ├── maintenance.ts
│   │   ├── home-info.ts
│   │   ├── completion-logs.ts
│   │   ├── activity.ts
│   │   ├── bulletins.ts
│   │   ├── protocols.ts
│   │   ├── lists.ts
│   │   ├── documents.ts
│   │   └── notifications.ts
│   ├── components/
│   │   ├── ui/                      # Shared primitives
│   │   ├── completion-log/          # Reusable CompletionLog widget
│   │   ├── secure-code/             # SecureCode (mask/reveal/timer/copy)
│   │   └── home-selector/           # Global property filter
│   ├── lib/
│   │   ├── prisma.ts                # Prisma client singleton
│   │   ├── auth.ts                  # NextAuth config
│   │   ├── permissions.ts           # Role check helpers
│   │   └── encryption.ts            # AES-256 for sensitive fields
│   └── types/                       # Shared TypeScript types
├── public/
├── uploads/                         # Uploaded files
├── .env
└── package.json
```

---

## NON-FUNCTIONAL REQUIREMENTS

| Requirement | Target |
|-------------|--------|
| Response time | < 500ms API calls |
| Database | SQLite (single file, zero config) |
| Auth | Username/password + JWT |
| Encryption | AES-256 for sensitive fields |
| Access control | 4-tier role per home |
| Auto-mask | 30 seconds for revealed codes |
| Concurrent users | 4 (SQLite handles this fine) |
| Browser support | Chrome, Edge, Safari |
