# MiHomes — System Architecture

---

## High-Level Overview

```
┌─────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                       │
│                                                         │
│   Next.js 14 (App Router)        React Native (future)  │
│   Web Browser                    iOS + Android          │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS
┌────────────────────────▼────────────────────────────────┐
│                   API LAYER  (Railway / VPS)             │
│                                                         │
│   Django 5.1 + DRF                                      │
│   REST API (/api/v1/)                                   │
│                                                         │
│   ┌──────────────┐  ┌─────────────────┐                │
│   │ Auth         │  │ Business Logic  │                │
│   │ (SimpleJWT)  │  │ (Viewsets,      │                │
│   │              │  │  serializers,   │                │
│   │              │  │  permissions)   │                │
│   └──────────────┘  └─────────────────┘                │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│   SQLite                                                │
│                                                         │
│   - All MiHomes data                                    │
│   - Encrypted sensitive fields                          │
│   - Audit logs                                          │
│   - Single file, zero infrastructure                    │
└─────────────────────────────────────────────────────────┘
```

---

## Django Project Structure

```
backend/
├── manage.py
├── requirements.txt
├── db.sqlite3
├── .env
├── media/                    # Uploaded files
│
├── config/
│   ├── settings/
│   │   ├── base.py
│   │   ├── development.py
│   │   └── production.py
│   ├── urls.py
│   └── wsgi.py
│
├── apps/
│   ├── accounts/             # User model, JWT auth (register/login/me)
│   ├── homes/                # Home, HomeMember
│   ├── tasks/                # Task, TaskAssignee
│   ├── events/               # Event
│   ├── people/               # Person (resident/staff/contact)
│   ├── vendors/              # Vendor, VendorHome
│   ├── maintenance/          # MaintenanceTask (dynamic status, next_due)
│   ├── home_info/            # ServiceProvider, LockCode, InternetNetwork,
│   │                         # ApplianceWarranty, ImportantContact, UtilityBill,
│   │                         # SmartHomeSystem, EmergencyInfo, AccessLog
│   ├── activity/             # ActivityLog
│   ├── bulletins/            # Bulletin
│   ├── protocols/            # Protocol
│   ├── lists/                # List, ListItem
│   ├── documents/            # Document (file upload)
│   └── notifications/        # Notification + trigger logic
│
└── shared/
    ├── models.py             # CompletionLog (polymorphic)
    ├── mixins.py             # HomeFilterMixin, TimestampMixin
    └── pagination.py
```

---

## Frontend Structure

```
frontend/
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── register/
│   │   └── (dashboard)/
│   │       ├── page.tsx              # Overview
│   │       ├── tasks/
│   │       ├── calendar/
│   │       ├── people/
│   │       ├── vendors/
│   │       ├── maintenance/
│   │       ├── documents/
│   │       ├── activity/
│   │       └── homes/
│   │           └── [id]/             # Home detail + all 8 info sections
│   ├── components/
│   │   ├── ui/                       # Shared primitives (Button, Modal, etc.)
│   │   ├── completion-log/           # Reusable CompletionLog widget
│   │   ├── secure-code/              # SecureCode (mask/reveal/timer/copy)
│   │   ├── home-selector/            # Global property filter dropdown
│   │   └── ...feature components
│   ├── lib/
│   │   └── api.ts                    # Typed API client (fetch wrapper)
│   └── types/                        # Shared TypeScript types
└── public/
```

---

## Authentication Flow

```
User submits username + password to POST /api/v1/auth/login/
        │
        ▼
Django validates credentials via authenticate()
        │
        ▼
SimpleJWT issues token pair:
  - access token  (30 min)
  - refresh token (7 days)
        │
        ▼
Client stores tokens (httpOnly cookie or memory)
Includes access token in Authorization: Bearer <token> header
        │
        ▼
On 401 response → client calls POST /auth/token/refresh/
  → new access token issued silently
```

---

## Security Architecture

### Sensitive Field Encryption

Lock codes and Wi-Fi passwords are encrypted using `django-encrypted-model-fields`:

```
Write path:
  plaintext → AES-256 encryption (Django model field) → ciphertext stored in SQLite

Read path (standard):
  ciphertext field → excluded from serializer output entirely

Read path (reveal):
  POST /lock-codes/{id}/reveal/  (manager+ only)
    → ciphertext → AES-256 decryption → plaintext in response
    → access_log entry written (user, entity, timestamp, IP)
    → response includes mask_after timestamp (now + 30s)
```

The encryption key is stored in the environment variable `ENCRYPTION_KEY` and never in source code.

### API Query Scoping

All viewsets inherit `HomeFilterMixin` from `shared/mixins.py`:

```python
def get_queryset(self):
    return super().get_queryset().filter(
        home__memberships__user=self.request.user
    )
```

This prevents cross-home data leakage at the ORM level — a user can only ever see records belonging to homes they are a member of.

### Role Permission Classes

Defined in `shared/permissions.py`, applied per-action on viewsets:

```
IsHomeOwner      → owner role only
IsHomeAdmin      → admin or owner
IsHomeManager    → manager, admin, or owner
IsHomeMember     → any member (viewer+)
```

### Access Log (Read-Only Audit)

Every reveal of a lock code or Wi-Fi password writes an `AccessLog` entry with:
- User ID + username
- Entity type + entity ID
- IP address
- Timestamp

The `AccessLog` model has no update or delete methods exposed — enforced at the viewset level. Accessible to owners and admins under home settings.

---

## Notification System

Notifications are triggered synchronously at the point of action (no background queue needed at this scale):

| Trigger | When fired |
|---------|-----------|
| Task assigned | On task create/update when assignees change |
| Task due soon | Daily management command at 8:00 AM |
| Event reminder | Daily management command at 8:00 AM |
| Maintenance overdue | Daily management command at 8:00 AM |
| Maintenance due soon | Daily management command at 8:00 AM |
| Warranty expiring | Daily management command at 8:00 AM |
| Bulletin posted | On bulletin create |
| @mention in activity | On activity log create |

Daily checks run via a Django management command (`python manage.py send_notifications`) scheduled by the host (Railway cron or VPS cron job).

---

## Deployment

| Component | Platform | Notes |
|-----------|----------|-------|
| Django API + frontend proxy | Railway or VPS | Single service |
| SQLite | Same server as Django | Single file, backed up daily |
| Media files | Same server as Django | Served via Django in dev; nginx in prod |
| Next.js | Vercel or same VPS | Static export or Node server |
| Domain | mihomes.app | DNS → hosting provider |

### Environment Variables (Backend)

```
SECRET_KEY=
DEBUG=False
ENCRYPTION_KEY=          # AES-256 key for sensitive fields
ALLOWED_HOSTS=
CORS_ALLOWED_ORIGINS=
```

### Environment Variables (Frontend)

```
NEXT_PUBLIC_API_URL=
```
