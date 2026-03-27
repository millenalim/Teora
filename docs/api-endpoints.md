# MiHomes — API Endpoints Reference

Base URL: `/api/v1/`

All endpoints require `Authorization: Bearer <jwt>` unless noted.
All list endpoints support `?home_id=<uuid>` for filtering (global property selector).
Pagination: `?page=1&page_size=20` (default page_size: 20).

---

## Auth

| Method | Path | Description |
|--------|------|-------------|
| GET | `/auth/microsoft/login/` | Redirect to Azure AD OAuth flow |
| GET | `/auth/microsoft/callback/` | OAuth callback; returns JWT pair |
| POST | `/auth/token/refresh/` | Refresh access token |
| GET | `/auth/me/` | Current user profile |
| POST | `/auth/logout/` | Invalidate refresh token |

---

## Homes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/homes/` | List all homes for current user |
| POST | `/homes/` | Create home (owner+ only) |
| GET | `/homes/{id}/` | Home detail |
| PATCH | `/homes/{id}/` | Update home (admin+ only) |
| DELETE | `/homes/{id}/` | Delete home (owner only) |
| GET | `/homes/{id}/members/` | List home members |
| POST | `/homes/{id}/members/` | Add member (admin+ only) |
| PATCH | `/homes/{id}/members/{user_id}/` | Update member role (admin+ only) |
| DELETE | `/homes/{id}/members/{user_id}/` | Remove member (admin+ only) |
| GET | `/homes/{id}/summary/` | Task/vendor/event counts for dashboard card |

---

## Tasks (Planner proxy)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/tasks/` | List tasks; filter by `?home_id=`, `?status=`, `?priority=`, `?completed=` |
| POST | `/tasks/` | Create task (syncs to Planner) |
| GET | `/tasks/{id}/` | Task detail |
| PATCH | `/tasks/{id}/` | Update task (syncs to Planner) |
| DELETE | `/tasks/{id}/` | Delete task (syncs to Planner) |
| PATCH | `/tasks/{id}/move/` | Move to bucket/status (kanban drag-drop) |
| POST | `/tasks/sync/` | Force sync all tasks from Planner (admin+ only) |

---

## Events (Outlook Calendar proxy)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/events/` | List events; filter by `?home_id=`, `?month=YYYY-MM` |
| POST | `/events/` | Create event (syncs to Outlook) |
| GET | `/events/{id}/` | Event detail |
| PATCH | `/events/{id}/` | Update event (syncs to Outlook) |
| DELETE | `/events/{id}/` | Delete event (syncs to Outlook) |
| POST | `/events/sync/` | Force sync from Outlook (admin+ only) |

---

## Documents (SharePoint proxy)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/documents/` | List documents; filter by `?home_id=`, `?category=` |
| POST | `/documents/` | Upload file to SharePoint + store metadata |
| GET | `/documents/{id}/` | Document detail |
| PATCH | `/documents/{id}/` | Update metadata |
| DELETE | `/documents/{id}/` | Delete from SharePoint + DB |

---

## People

| Method | Path | Description |
|--------|------|-------------|
| GET | `/people/` | List people; filter by `?home_id=`, `?role=` |
| POST | `/people/` | Create person |
| GET | `/people/{id}/` | Person detail |
| PATCH | `/people/{id}/` | Update person |
| DELETE | `/people/{id}/` | Delete person |

---

## Vendors

| Method | Path | Description |
|--------|------|-------------|
| GET | `/vendors/` | List vendors; filter by `?home_id=`, `?service_type=` |
| POST | `/vendors/` | Create vendor |
| GET | `/vendors/{id}/` | Vendor detail |
| PATCH | `/vendors/{id}/` | Update vendor |
| DELETE | `/vendors/{id}/` | Delete vendor |
| GET | `/vendors/compare/` | Compare vendors (`?ids=uuid1,uuid2,uuid3`) |

---

## Maintenance

| Method | Path | Description |
|--------|------|-------------|
| GET | `/maintenance/` | List tasks; filter by `?home_id=`, `?status=` |
| POST | `/maintenance/` | Create maintenance task |
| GET | `/maintenance/{id}/` | Task detail |
| PATCH | `/maintenance/{id}/` | Update task |
| DELETE | `/maintenance/{id}/` | Delete task |

---

## Home Info Sections

All sections follow the same pattern: `GET /`, `POST /`, `GET /{id}/`, `PATCH /{id}/`, `DELETE /{id}/`.

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

### Lock Code & Wi-Fi Password Security

```
GET  /lock-codes/          # Returns codes masked (code field omitted)
GET  /lock-codes/{id}/     # Returns code masked by default
GET  /lock-codes/{id}/?reveal=true  # Returns decrypted code; logs access; manager+ only

GET  /network/{id}/?reveal=true     # Returns decrypted Wi-Fi password; logs access; manager+ only
```

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

No POST, PATCH, or DELETE — read-only.

---

## Bulletins

| Method | Path | Description |
|--------|------|-------------|
| GET | `/bulletins/` | List bulletins; filter by `?home_id=` |
| POST | `/bulletins/` | Create bulletin |
| GET | `/bulletins/{id}/` | Bulletin detail |
| PATCH | `/bulletins/{id}/` | Update bulletin (author or admin+) |
| DELETE | `/bulletins/{id}/` | Delete bulletin (author or admin+) |

---

## Activity Log

| Method | Path | Description |
|--------|------|-------------|
| GET | `/activity/` | List entries; filter by `?home_id=`; newest first |
| POST | `/activity/` | Add entry |
| DELETE | `/activity/{id}/` | Delete entry (author or admin+) |

Real-time updates pushed via WebSocket: `ws://api/ws/activity/?home_id=<uuid>`

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

Real-time push via WebSocket: `ws://api/ws/notifications/`

---

## WebSocket Channels

| Channel | URL | Events |
|---------|-----|--------|
| Activity log | `ws://api/ws/activity/?home_id=<uuid>` | `activity.created`, `activity.deleted` |
| Notifications | `ws://api/ws/notifications/` | `notification.new` |
| Task sync | `ws://api/ws/tasks/?home_id=<uuid>` | `task.updated`, `task.created`, `task.deleted` |

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
| 503 | Microsoft Graph unavailable |
