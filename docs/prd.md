# Teora — Product Requirements Document v2

## Product Vision

Teora is a centralized estate management platform for teams managing multiple residential properties. It integrates with Microsoft 365 (Planner, Outlook, SharePoint) and layers purpose-built estate management features on top — giving property teams a single place to organize tasks, people, vendors, maintenance, and critical home information across all properties.

**Name:** Teora (터 — Korean for "foundation, ground, site")
**Target Users:** 4 team members managing 4 homes
**Platform:** Web (Next.js) + Mobile (React Native)
**Backend:** Django 5 + DRF + PostgreSQL + Microsoft Graph API

---

## TECH STACK

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

## FEATURE INVENTORY

Everything below maps to what exists in the current dashboard prototype plus confirmed enhancements.

---

### 1. Microsoft 365 Integration Hub

#### 1a. Microsoft SSO Authentication
- Sign in with Microsoft account (Azure AD OAuth 2.0)
- No separate Teora credentials — single sign-on
- Token management with encrypted storage and auto-refresh
- Role mapping from M365 group membership
- Each home maps to an M365 Group (auto-provisioned on home creation)

#### 1b. Microsoft Planner Integration (Tasks + Kanban)
- **Bidirectional sync**: tasks created in Teora appear in Planner and vice versa
- **Kanban board view** mirroring Planner buckets: To Do, In Progress, Review, Done
- **Task list view** with sortable columns: subject, start date, end date, priority, status, property, assignees
- **Active / Completed tabs** for filtering task state
- Drag-and-drop between kanban columns syncs bucket changes to Planner
- Multi-assignee support mapped to M365 group members (checkbox selection)
- Priority levels: High, Medium, Low
- Optional start date and end date (not required)
- Task description field
- Tasks with dates auto-appear on Outlook Group Calendar
- Filter by home using global property selector

#### 1c. Outlook Group Calendar Integration
- **Read/write** to the M365 group calendar per home
- Events created in Teora appear in everyone's Outlook automatically
- Monthly grid calendar view with navigation arrows
- Events span across all days between start and end date (color-coded by home)
- Tasks also appear on calendar when dates are set (yellow pins)
- Clicking an event or task on the calendar opens its edit modal
- Supports: title, home, assignee, start date (optional), end date (optional), time, notes
- **Event completion log**: tracks every time the event was completed — date, completed by, cost, notes (see §8 Completion Log Pattern)
- Prevents scheduling clashes since everyone shares the same Outlook calendar
- Quick-add buttons for both tasks and events from calendar view

#### 1d. SharePoint / OneDrive Integration (Documents)
- Files upload to the M365 group's SharePoint document library
- Organized by home and category
- Categories: Contract, Insurance, Manual, Protocol, Receipt, Tax, Other
- Table view with sortable columns: title, category, property, link, date
- Clickable links to open directly in SharePoint/OneDrive
- File metadata stored in Teora DB (title, category, date, notes)
- Search by title, category, and home

---

### 2. Property Management

#### 2a. Home Profiles
- 4 homes, each with: name, address, square footage, lot size, purpose/description, color tag
- Each home maps to an M365 Group (auto-provisioned)
- Overview dashboard cards showing task/vendor/event counts per home
- Edit home details via modal (name, address, sqft, lot size, purpose)

#### 2b. Home Purpose & Description
- Each home has a clearly defined purpose (e.g., "Primary residence," "Vacation rental," "Long-term rental," "Under renovation")
- Visible on overview card, editable by owners/admins

#### 2c. Global Property Filter
- Dropdown in top navigation: "All Properties" or select a specific home
- Filter applies across all views — tasks, calendar, vendors, people, home details, activity log, etc.

---

### 3. People Management

#### 3a. People Directory
- Three roles: **Resident**, **Staff**, **Contact**
- Filter tabs: All, Resident, Staff, Contact
- Card grid layout per person
- Fields: name, role, phone, email, company, home assignment, notes
- Avatar circle with first initial, color-coded by role (blue = Resident, pink = Staff, green = Contact)
- Optional link to M365 user account
- People feed into: assignee dropdowns, @mention autocomplete, completion log "completed by" fields
- Edit/delete per person via modal

---

### 4. Vendor Management

#### 4a. Vendor Directory
- Card grid layout per vendor
- Fields: company name, service type, phone, email, website, pricing, quote amount, rating (1–5), notes
- Multi-home tagging via checkboxes (vendor can serve multiple homes)
- Home pills displayed on card
- Filter by selected home
- Edit/delete per vendor via modal

#### 4b. Vendor Comparison (P2)
- Side-by-side comparison view for vendors of the same service type
- Compare pricing, quotes, ratings across homes
- Accessible via `/vendors/compare/?ids=1,2,3`

---

### 5. Maintenance System

#### 5a. Maintenance Tasks
- Fields: task name, frequency, provider, estimated cost, home, notes
- Frequency options: Weekly, Bi-Weekly, Monthly, Quarterly, Semi-Annually, Annually, As Needed

#### 5b. Dynamic Status Tracking
- Auto-calculated status based on `next_due` vs today:
  - **Overdue** (red) — past due
  - **Due Soon** (amber) — within 7 days
  - **On Track** (green) — more than 7 days out
  - **No Schedule** (gray) — no next due date set

#### 5c. Completion Log
- Each maintenance task has an expandable completion log
- Log entries: date completed, completed by, cost, notes
- **Next due date auto-calculates** from last completion date + frequency
- Reverse chronological display, newest first
- Individual log entries deletable (recalculates next due on delete)

#### 5d. Planner Auto-Creation (P1)
- When maintenance task is within 7 days of due: auto-create Planner task in "To Do" bucket
- Calendar event created on due date
- Notification sent to assigned team members

---

### 6. Home Information Sections (per home)

All sections accessible via pill/tab navigation under "Home Details." Each follows the same CRUD pattern.

#### 6a. Service Providers
- Fields: name, service type, phone, email, notes

#### 6b. Lock & Access Codes 🔒
- Fields: location, code/password, type (keypad, smart lock, gate, garage, etc.), notes
- Codes masked by default; reveal on click with auto-hide after 30 seconds
- AES-256 encrypted at rest; access logging on every reveal
- Permission-gated: manager+ only; clipboard copy without visual reveal
- Codes never returned in standard API responses (`?reveal=true` required)

#### 6c. Internet & Network
- Fields: provider, account number, plan details, Wi-Fi name, Wi-Fi password, router IP, notes
- Wi-Fi password follows same security pattern as lock codes
- Completion log: track service visits, equipment changes

#### 6d. Appliance Warranties
- Fields: appliance, brand, model, serial number, purchase date, warranty expiration, purchased from, notes
- Expiration alerts at 30 and 7 days
- Completion log: track service calls, repairs, claims

#### 6e. Important Contacts
- Fields: name, type, phone, email, account number, policy number, notes
- Types: HOA, Home Insurance, Landlord, Property Manager, Mortgage Co., Pest Control, Landscaping, Pool Service, Security Co., Other
- Completion log: track interactions

#### 6f. Utility Bills
- Fields: utility type, provider, account number, avg monthly cost, due date, autopay, notes
- Types: Electric, Gas, Water, Sewer, Trash/Recycling, Internet, Solar, Other
- Completion log: track payments, rate changes, service calls

#### 6g. Smart Home Systems
- Fields: system name, app name, hub/bridge model, account email, connected devices, notes
- Completion log: track firmware updates, device changes, troubleshooting

#### 6h. Emergency Info
- Fields: item (e.g., "Main water shutoff"), location, details, notes
- Completion log: track inspections and tests

---

### 7. Communication & Collaboration

#### 7a. Bulletin Board
- Pinned on Overview dashboard
- Fields: title, content, home, author, date
- @mentions rendered as colored badges (blue = vendors, pink = people)

#### 7b. Activity Log
- Timestamped feed per home; real-time via WebSocket
- @mentions with colored badges
- Reverse chronological; deletable entries
- Filtered by global home selector

#### 7c. Protocols
- Fields: title, category, home, content, linked document, last reviewed date
- Categories: Emergency, Cleaning, Opening/Closing, Security, Guest, Maintenance, Other
- Completion log: track reviews and updates

#### 7d. Lists (Checklists)
- Fields: title, home, items (text + done/not done)
- Interactive checkboxes; progress indicator ("3/5 done")
- Use cases: move-in, seasonal prep, shopping, inspection, guest prep

---

### 8. Completion Log Pattern (Cross-Cutting)

Reusable pattern attached to multiple sections.

#### 8a. Standard Log Fields
- Date, Completed by (dropdown or free text), Cost (optional), Notes (optional)

#### 8b. UI Behavior
- Collapsed by default: "▸ View Log (3)"
- Expandable inline; add form at top; reverse chronological
- Each entry individually deletable

#### 8c. Where Applied

| Section | What the log tracks |
|---------|-------------------|
| Maintenance tasks | Completions (auto-calculates next due date) |
| Events | Each time the event occurred |
| Internet & Network | Service visits, equipment changes |
| Appliance Warranties | Service calls, repairs, claims |
| Important Contacts | Calls, meetings, renewals |
| Utility Bills | Payments, rate changes, service calls |
| Smart Home Systems | Firmware updates, device changes |
| Emergency Info | Inspections, tests |
| Protocols | Reviews, updates, training |

#### 8d. Database Design
```sql
completion_logs (
  id            UUID PRIMARY KEY,
  entity_type   VARCHAR,   -- "maintenance", "event", "warranty", etc.
  entity_id     UUID,      -- FK to parent record
  home_id       UUID,      -- FK to homes
  completed_date DATE,
  completed_by  UUID,      -- FK to people (nullable)
  cost          VARCHAR,
  notes         TEXT,
  created_at    TIMESTAMPTZ
  -- INDEX on (entity_type, entity_id)
)
```

---

### 9. Notification System

#### 9a. Trigger Events

| Trigger | Timing | Action |
|---------|--------|--------|
| Maintenance overdue | `next_due < today` | Planner task + notification |
| Maintenance due soon | within 7 days | Planner task + notification |
| Warranty expiring | 30 and 7 days before | Notification |
| Task assigned | Immediately | Notification |
| Task due soon | 3 days before end_date | Notification |
| Event reminder | 1 day before start_date | Notification |
| Bulletin posted | Immediately | Notification to all home members |
| @mention in activity log | Immediately | Notification to mentioned person |

#### 9b. Delivery
- In-app notification bell with unread badge
- Real-time push via WebSocket (Django Channels)
- Outlook Calendar events for maintenance/event reminders
- (Future) Email digest, mobile push

#### 9c. Celery Beat Schedule
- Daily 8:00 AM — overdue maintenance check
- Daily 8:15 AM — upcoming events (1 day)
- Daily 8:30 AM — upcoming task due dates (3 days)
- Monday 9:00 AM — expiring warranties (30/7 days)

---

### 10. Security

#### 10a. Auth & Roles
- Microsoft SSO (Azure AD OAuth 2.0); JWT (access: 30 min, refresh: 7 days)
- 4-tier role system per home:

| Role | View | Edit | Manage Members | Delete Home |
|------|------|------|----------------|-------------|
| Owner | ✓ | ✓ | ✓ | ✓ |
| Admin | ✓ | ✓ | ✓ | ✗ |
| Manager | ✓ | ✓ | ✗ | ✗ |
| Viewer | ✓ | ✗ | ✗ | ✗ |

#### 10b. Sensitive Field Encryption
- AES-256 at rest; never in standard API responses
- `?reveal=true` required, triggers access log

#### 10c. Access Logging
- Every reveal logged: who, what, when, IP, device
- Read-only log; retained indefinitely; accessible to owners/admins

#### 10d. Auto-Scope Querysets
- All API queries filtered to requesting user's homes via `HomeFilterMixin`

---

### 11. Overview Dashboard

- Home summary cards: name, address, purpose, color, task/vendor/event counts
- Bulletin board section with quick-add
- Upcoming tasks panel: top 5 non-done tasks, color-coded by home
- Recent activity panel: last 5 entries with @mention badges

---

## FUTURE ENHANCEMENTS (P2/P3)

| # | Feature | Priority |
|---|---------|----------|
| 12 | Expense tracking & budget dashboard | P2 ⭐ |
| 13 | Vendor work order system | P2 ⭐ |
| 14 | Seasonal / recurring task templates | P2 ⭐ |
| 15 | Key date & renewal tracker | P2 ⭐ |
| 16 | Global search / quick find | P2 |
| 17 | Audit trail / change history | P3 |
| 18 | Property comparison dashboard | P3 |
| 19 | Guest & visitor management | P3 |
| 20 | Mobile quick actions | P3 |

---

## FEATURE PRIORITY MATRIX

| Priority | Feature | Effort | Impact |
|----------|---------|--------|--------|
| **P0** | Microsoft SSO + Graph integration | High | Critical |
| **P0** | Planner sync (tasks + kanban + list) | High | Critical |
| **P0** | Outlook Calendar sync + completion log | High | Critical |
| **P0** | Home profiles + global filter | Low | High |
| **P0** | People management | Medium | High |
| **P0** | Vendor directory | Medium | High |
| **P0** | Maintenance + completion logs | Medium | High |
| **P0** | Home info sections (all 8) | Medium | High |
| **P0** | Lock code security | Medium | Critical |
| **P1** | SharePoint document sync | Medium | High |
| **P1** | Bulletin board + @mentions | Low | Medium |
| **P1** | Activity log + WebSocket | Medium | High |
| **P1** | Notification system | Medium | High |
| **P1** | Protocols + Lists | Low | Medium |
| **P2** | Expense tracking | High | ⭐ Very High |
| **P2** | Work order system | Medium | ⭐ Very High |
| **P2** | Seasonal templates | Medium | ⭐ High |
| **P2** | Key date tracker | Low | ⭐ High |

---

## NON-FUNCTIONAL REQUIREMENTS

| Requirement | Target |
|-------------|--------|
| API response time | < 500ms |
| Page load | < 3s |
| Availability | 99.5% |
| Sync latency | < 10s (webhook), < 5 min (polling fallback) |
| Encryption | AES-256 at rest |
| Auth tokens | Access: 30 min, Refresh: 7 days |
| Auto-mask timeout | 30 seconds |
| Session timeout | 5 min inactivity |
| Concurrent users | 4 (scalable to 50+) |
| Browsers | Chrome, Edge, Safari (last 2 versions) |

---

## ESTIMATED MONTHLY COSTS

| Service | Cost |
|---------|------|
| Railway (Django + Celery) | $10–20 |
| Railway (PostgreSQL) | $5–10 |
| Railway (Redis) | $5 |
| Vercel (Next.js) | $0 |
| Microsoft 365 (existing) | $0 |
| Domain (teora.app) | $12/yr |
| **Total** | **~$20–35/mo** |
