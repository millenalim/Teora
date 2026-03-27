# MiHomes — API Endpoints Reference

Base URL: `/api/v1/`

All endpoints require `Authorization: Bearer <access_token>` unless noted.
All list endpoints support `?home_id=<id>` for filtering (global property selector).
Pagination: `?page=1&page_size=20` (default page_size: 20).

---

## Auth

| Method | Path | Description | Auth required |
|--------|------|-------------|---------------|
| POST | `/auth/register/` | Register new user | No |
| POST | `/auth/login/` | Login; returns JWT pair | No |
| POST | `/auth/token/refresh/` | Refresh access token | No |
| GET | `/auth/me/` | Current user profile | Yes |
| PATCH | `/auth/me/` | Update profile (name, email, avatar) | Yes |
| POST | `/auth/me/password/` | Change password | Yes |
| POST | `/auth/logout/` | Blacklist refresh token | Yes |

---

## Homes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/homes/` | List all homes for current user |
| POST | `/homes/` | Create home |
| GET | `/homes/{id}/` | Home detail |
| PATCH | `/homes/{id}/` | Update home (admin+ only) |
| DELETE | `/homes/{id}/` | Delete home (owner only) |
| GET | `/homes/{id}/members/` | List home members |
| POST | `/homes/{id}/members/` | Add member (admin+ only) |
| PATCH | `/homes/{id}/members/{user_id}/` | Update member role (admin+ only) |
| DELETE | `/homes/{id}/members/{user_id}/` | Remove member (admin+ only) |
| GET | `/homes/{id}/summary/` | Task/vendor/event/maintenance counts for dashboard card |

---

## Tasks

| Method | Path | Description |
|--------|------|-------------|
| GET | `/tasks/` | List tasks; filter by `?home_id=`, `?status=`, `?priority=`, `?completed=` |
| POST | `/tasks/` | Create task |
| GET | `/tasks/{id}/` | Task detail |
| PATCH | `/tasks/{id}/` | Update task |
| DELETE | `/tasks/{id}/` | Delete task |
| PATCH | `/tasks/{id}/move/` | Update status (kanban drag-drop) |

---

## Events

| Method | Path | Description |
|--------|------|-------------|
| GET | `/events/` | List events; filter by `?home_id=`, `?month=YYYY-MM` |
| POST | `/events/` | Create event |
| GET | `/events/{id}/` | Event detail |
| PATCH | `/events/{id}/` | Update event |
| DELETE | `/events/{id}/` | Delete event |

### Calendar endpoint (merged view)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/calendar/` | Tasks + events for a date range; filter by `?home_id=`, `?start=YYYY-MM-DD`, `?end=YYYY-MM-DD` |

Returns a combined list of tasks (with dates) and events, each with a `type` field (`"task"` or `"event"`).

---

## Documents

| Method | Path | Description |
|--------|------|-------------|
| GET | `/documents/` | List documents; filter by `?home_id=`, `?category=` |
| POST | `/documents/` | Upload file + store metadata (multipart/form-data) |
| GET | `/documents/{id}/` | Document detail |
| PATCH | `/documents/{id}/` | Update metadata |
| DELETE | `/documents/{id}/` | Delete file + record |

---

## People

| Method | Path | Description |
|--------|------|-------------|
| GET | `/people/` | List people; filter by `?home_id=`, `?role=` |
| POST | `/people/` | Create person |
| GET | `/people/{id}/` | Person detail |
| PATCH | `/people/{id}/` | Update person |
| DELETE | `/people/{id}/` | Delete person |
| GET | `/people/mentions/` | Search for @mention autocomplete (`?home_id=&q=`) |

---

## Vendors

| Method | Path | Description |
|--------|------|-------------|
| GET | `/vendors/` | List vendors; filter by `?home_id=`, `?service_type=` |
| POST | `/vendors/` | Create vendor |
| GET | `/vendors/{id}/` | Vendor detail |
| PATCH | `/vendors/{id}/` | Update vendor |
| DELETE | `/vendors/{id}/` | Delete vendor |

---

## Maintenance

| Method | Path | Description |
|--------|------|-------------|
| GET | `/maintenance/` | List tasks; filter by `?home_id=`, `?status=` |
| POST | `/maintenance/` | Create maintenance task |
| GET | `/maintenance/{id}/` | Task detail (includes computed `status` field) |
| PATCH | `/maintenance/{id}/` | Update task |
| DELETE | `/maintenance/{id}/` | Delete task |

The `status` field is computed on read: `overdue`, `due_soon`, `on_track`, or `no_schedule`.

---

## Home Info Sections

All sections follow the same pattern: `GET /`, `POST /`, `GET /{id}/`, `PATCH /{id}/`, `DELETE /{id}/`.
All support `?home_id=` filtering.

| Section | Base Path |
|---------|-----------|
| Service Providers | `/service-providers/` |
| Lock Codes | `/lock-codes/` |
| Internet & Network | `/network/` |
| Appliance Warranties | `/warranties/` |
| Important Contacts | `/important-contacts/` |
| Utility Bills | `/utilities/` |
| Smart Home Systems | `/smart-home/` |
| Emergency Info | `/emergency-info/` |

### Sensitive Field Security (Lock Codes + Wi-Fi Password)

```
GET  /lock-codes/          # code field omitted entirely
GET  /lock-codes/{id}/     # code field omitted entirely
POST /lock-codes/{id}/reveal/  # Returns decrypted code; logs access; manager+ only

POST /network/{id}/reveal/     # Returns decrypted Wi-Fi password; logs access; manager+ only
```

Reveal responses include a `mask_after` field (Unix timestamp 30s in the future) so the client knows when to re-mask.

---

## Completion Logs

| Method | Path | Description |
|--------|------|-------------|
| GET | `/completion-logs/` | List logs; filter by `?entity_type=&entity_id=` |
| POST | `/completion-logs/` | Add log entry |
| DELETE | `/completion-logs/{id}/` | Delete log entry |

Supported `entity_type` values: `maintenance`, `event`, `network`, `warranty`, `contact`, `utility`, `smart_home`, `emergency`, `protocol`

---

## Access Logs (Sensitive Data Audit)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/access-logs/` | List access logs; filter by `?home_id=`, `?entity_type=`; owner/admin only |

Read-only — no POST, PATCH, or DELETE.

---

## Bulletins

| Method | Path | Description |
|--------|------|-------------|
| GET | `/bulletins/` | List bulletins; filter by `?home_id=` |
| POST | `/bulletins/` | Create bulletin |
| GET | `/bulletins/{id}/` | Bulletin detail |
| PATCH | `/bulletins/{id}/` | Update (author or admin+) |
| DELETE | `/bulletins/{id}/` | Delete (author or admin+) |

---

## Activity Log

| Method | Path | Description |
|--------|------|-------------|
| GET | `/activity/` | List entries; filter by `?home_id=`; newest first |
| POST | `/activity/` | Add entry |
| DELETE | `/activity/{id}/` | Delete entry (author or admin+) |

---

## Protocols

| Method | Path | Description |
|--------|------|-------------|
| GET | `/protocols/` | List protocols; filter by `?home_id=`, `?category=` |
| POST | `/protocols/` | Create protocol |
| GET | `/protocols/{id}/` | Protocol detail |
| PATCH | `/protocols/{id}/` | Update protocol |
| DELETE | `/protocols/{id}/` | Delete protocol |

---

## Lists (Checklists)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/lists/` | List checklists; filter by `?home_id=` |
| POST | `/lists/` | Create list |
| GET | `/lists/{id}/` | List detail with items |
| PATCH | `/lists/{id}/` | Update list title |
| DELETE | `/lists/{id}/` | Delete list |
| POST | `/lists/{id}/items/` | Add item |
| PATCH | `/lists/{id}/items/{item_id}/` | Update item (toggle done, edit text) |
| DELETE | `/lists/{id}/items/{item_id}/` | Delete item |

---

## Notifications

| Method | Path | Description |
|--------|------|-------------|
| GET | `/notifications/` | List notifications for current user |
| PATCH | `/notifications/{id}/read/` | Mark as read |
| POST | `/notifications/read-all/` | Mark all as read |

---

## Common Response Codes

| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 204 | No Content (DELETE) |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing/expired token) |
| 403 | Forbidden (insufficient role) |
| 404 | Not Found |
| 429 | Rate Limited |
