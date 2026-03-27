# MiHomes — System Architecture

---

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│                                                                 │
│   Next.js 14 (Vercel)          React Native / Expo             │
│   Web Browser                  iOS + Android                    │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTPS / WSS
┌────────────────────────▼────────────────────────────────────────┐
│                        API LAYER  (Railway)                     │
│                                                                 │
│   Django 5.1 + DRF                Django Channels              │
│   REST API (/api/v1/)             WebSocket (/ws/)              │
│                                                                 │
│   ┌─────────────┐  ┌────────────────┐  ┌──────────────────┐   │
│   │ Auth        │  │ Business Logic │  │ Graph Client     │   │
│   │ (Azure AD + │  │ (Viewsets,     │  │ (M365 Planner,  │   │
│   │  JWT)       │  │  serializers,  │  │  Outlook,       │   │
│   │             │  │  permissions)  │  │  SharePoint)    │   │
│   └─────────────┘  └────────────────┘  └──────────────────┘   │
└────────────┬───────────────────────────────────┬───────────────┘
             │                                   │
┌────────────▼──────────┐         ┌──────────────▼───────────────┐
│  PostgreSQL 16        │         │  Redis                        │
│  (Railway)            │         │  (Railway)                    │
│                       │         │                               │
│  - All MiHomes data     │         │  - Django Channels layer      │
│  - Encrypted fields   │         │  - Celery task queue          │
│  - Audit logs         │         │  - Session/token cache        │
└───────────────────────┘         └───────────────────────────────┘
             │
┌────────────▼──────────────────────────────────────────────────┐
│  Celery Worker + Beat  (Railway)                               │
│                                                                │
│  Beat (scheduler):                Worker:                      │
│  - Daily maintenance checks       - Graph API sync tasks       │
│  - Warranty expiry alerts         - Notification dispatch      │
│  - Task due-date alerts           - Planner auto-creation      │
│  - Weekly key-date checks         - Outlook event creation     │
└───────────────────────────────────────────────────────────────┘
             │
┌────────────▼──────────────────────────────────────────────────┐
│  Microsoft Graph API (external)                                │
│                                                                │
│  Azure AD (auth)    Planner (tasks)    Outlook (calendar)      │
│  SharePoint (files) Group Mgmt         Webhooks                │
└───────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
MiHomes/
├── backend/
│   ├── config/
│   │   ├── settings/
│   │   │   ├── base.py
│   │   │   ├── development.py
│   │   │   └── production.py
│   │   ├── urls.py
│   │   ├── asgi.py           # Django Channels entry point
│   │   └── wsgi.py
│   ├── apps/
│   │   ├── auth/             # Microsoft SSO, JWT, user model
│   │   ├── homes/            # Home profiles, memberships
│   │   ├── people/           # Residents, Staff, Contacts
│   │   ├── vendors/          # Vendor directory
│   │   ├── tasks/            # Planner proxy (tasks + kanban)
│   │   ├── events/           # Outlook Calendar proxy
│   │   ├── documents/        # SharePoint metadata
│   │   ├── maintenance/      # Maintenance tasks + scheduling
│   │   ├── home_info/        # All 8 home info sections
│   │   │   ├── lock_codes/
│   │   │   ├── network/
│   │   │   ├── warranties/
│   │   │   ├── contacts/
│   │   │   ├── utilities/
│   │   │   ├── smart_home/
│   │   │   ├── emergency/
│   │   │   └── service_providers/
│   │   ├── completion_logs/  # Polymorphic completion log
│   │   ├── bulletins/
│   │   ├── activity/         # Activity log + WebSocket consumer
│   │   ├── protocols/
│   │   ├── lists/
│   │   ├── notifications/    # Notification model + Celery tasks
│   │   └── realtime/         # Django Channels consumers
│   ├── integrations/
│   │   └── graph/
│   │       ├── client.py     # Central GraphClient wrapper
│   │       ├── planner.py    # Planner-specific calls
│   │       ├── calendar.py   # Outlook calendar calls
│   │       ├── sharepoint.py # SharePoint/OneDrive calls
│   │       └── webhooks.py   # Graph webhook registration + handling
│   ├── core/
│   │   ├── mixins.py         # HomeFilterMixin, SensitiveFieldMixin
│   │   ├── permissions.py    # HomeRole permission classes
│   │   ├── encryption.py     # AES-256 field encryption helpers
│   │   └── pagination.py
│   └── requirements/
│       ├── base.txt
│       ├── development.txt
│       └── production.txt
│
├── frontend/
│   ├── src/
│   │   ├── app/              # Next.js App Router pages
│   │   │   ├── (auth)/
│   │   │   ├── (dashboard)/
│   │   │   │   ├── page.tsx         # Overview
│   │   │   │   ├── tasks/
│   │   │   │   ├── calendar/
│   │   │   │   ├── vendors/
│   │   │   │   ├── people/
│   │   │   │   ├── maintenance/
│   │   │   │   ├── documents/
│   │   │   │   ├── homes/[id]/      # Home detail + all sections
│   │   │   │   └── activity/
│   │   ├── components/
│   │   │   ├── ui/                  # Shared primitives
│   │   │   ├── completion-log/      # Reusable completion log widget
│   │   │   ├── home-selector/       # Global property filter
│   │   │   └── ...feature components
│   │   ├── lib/
│   │   │   ├── api.ts               # Typed API client
│   │   │   └── websocket.ts         # WebSocket client
│   │   └── types/                   # Shared TypeScript types
│   └── public/
│
└── docs/
```

---

## Authentication Flow

```
User clicks "Sign in with Microsoft"
        │
        ▼
Django redirects → Azure AD OAuth 2.0 authorization URL
        │
        ▼
User authenticates with Microsoft credentials
        │
        ▼
Azure AD redirects to /auth/microsoft/callback/ with code
        │
        ▼
Django exchanges code for M365 access + refresh tokens
  - Tokens stored encrypted in user_tokens table
  - User created/updated in users table
        │
        ▼
Django issues MiHomes JWT pair (access: 30min, refresh: 7 days)
        │
        ▼
Client stores JWT; includes in Authorization header on all API calls
        │
        ▼
Client uses refresh token to obtain new access tokens silently
```

---

## Microsoft Graph Integration

### GraphClient (`backend/integrations/graph/client.py`)

Central wrapper around Graph API calls:
- Manages per-home M365 group context
- Handles token refresh automatically
- Retries on 429 (rate limit) with exponential backoff
- Raises `GraphUnavailableError` on persistent failure (caught at view layer → 503)

### Sync Strategy

| Direction | Mechanism |
|-----------|-----------|
| MiHomes → Graph | Synchronous on write (task created → Planner task created) |
| Graph → MiHomes | Webhook subscriptions (Graph POSTs to `/api/v1/webhooks/graph/`) |
| Fallback | Celery periodic task polls Graph every 5 minutes if webhook missed |

### Webhook Flow
```
Graph detects change (Planner task updated)
        │
        ▼
Graph POSTs change notification to /api/v1/webhooks/graph/
        │
        ▼
Django validates notification (subscription ID + client state token)
        │
        ▼
Celery task fetches full updated resource from Graph
        │
        ▼
MiHomes DB updated; WebSocket broadcast to connected clients
```

---

## Security Architecture

### Sensitive Field Encryption

Lock codes and Wi-Fi passwords are encrypted before storage:

```
Write path:
  plaintext → AES-256 encryption (Django field) → ciphertext stored in DB

Read path (standard):
  DB ciphertext → field NOT included in serializer output

Read path (reveal=true):
  DB ciphertext → AES-256 decryption → plaintext in response
  + access_log entry written
  + auto-mask timer sent to client (30s)
```

### API Query Scoping

All viewsets inherit `HomeFilterMixin`:
```python
def get_queryset(self):
    return super().get_queryset().filter(
        home__memberships__user=self.request.user
    )
```
Prevents any cross-home data leakage at the ORM level.

### Role Permission Classes

```
IsHomeOwner      → owner only
IsHomeAdmin      → admin+
IsHomeManager    → manager+
IsHomeMember     → viewer+ (any member)
```

Applied per-action on viewsets (`permission_classes` or `get_permissions()`).

---

## Real-Time (Django Channels)

```
Client connects: ws://api/ws/activity/?home_id=<uuid>
        │
        ▼
ActivityConsumer authenticates JWT from query param
Joins room: f"activity_{home_id}"
        │
        ▼
When new activity log entry saved:
  → Channel layer broadcasts to room
  → All connected clients receive event instantly
```

Channel layer backend: Redis (Railway).

WebSocket channels:
- `activity_{home_id}` — activity log
- `notifications_{user_id}` — per-user notifications
- `tasks_{home_id}` — task kanban updates

---

## Celery Task Schedule

Managed by Celery Beat (Railway worker):

| Schedule | Task | Action |
|----------|------|--------|
| Daily 8:00 AM | `check_overdue_maintenance` | Create notifications + Planner tasks |
| Daily 8:15 AM | `check_upcoming_events` | Remind assignees (1 day ahead) |
| Daily 8:30 AM | `check_upcoming_task_due_dates` | Remind assignees (3 days ahead) |
| Monday 9:00 AM | `check_expiring_warranties` | Alert at 30 and 7 days |
| Every 5 min | `sync_planner_fallback` | Poll Graph if webhook missed |

---

## Deployment

| Component | Platform | Notes |
|-----------|----------|-------|
| Django API | Railway | Web service; auto-deploys from `main` |
| Celery Worker | Railway | Worker service; same Docker image |
| Celery Beat | Railway | Scheduler service; single instance only |
| PostgreSQL | Railway | Managed PostgreSQL 16 |
| Redis | Railway | Managed Redis |
| Next.js | Vercel | Auto-deploys from `main`; edge-optimized |
| Domain | mihomes.app | DNS → Vercel (frontend) + Railway (API) |

### Environment Variables (Backend)

```
SECRET_KEY
DATABASE_URL
REDIS_URL
AZURE_AD_CLIENT_ID
AZURE_AD_CLIENT_SECRET
AZURE_AD_TENANT_ID
ENCRYPTION_KEY           # AES-256 key for sensitive fields
ALLOWED_HOSTS
CORS_ALLOWED_ORIGINS
```

### Environment Variables (Frontend)

```
NEXT_PUBLIC_API_URL
NEXT_PUBLIC_WS_URL
NEXTAUTH_SECRET
NEXTAUTH_URL
```
