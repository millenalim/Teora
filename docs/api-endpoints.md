# Teora — Server Actions Reference

Teora uses Next.js server actions instead of a REST API. Data fetching happens in server components; mutations happen via server actions in `src/actions/`.

All actions verify the session via `auth()` from NextAuth and scope data to the user's homes via `requireHomeMember()`.

---

## Auth (`src/actions/auth.ts`)

| Action | Description |
|--------|-------------|
| `register(data)` | Create user account; returns session |
| `login(credentials)` | Validate username + password; creates session |
| `logout()` | Destroy session |
| `updateProfile(data)` | Update name, email, avatar |
| `changePassword(data)` | Validate old password, set new one |

Auth pages use NextAuth's built-in `signIn()` / `signOut()` on the client.

---

## Homes (`src/actions/homes.ts`)

| Action | Description |
|--------|-------------|
| `getHomes()` | All homes for current user |
| `getHome(id)` | Single home + membership check |
| `getHomeSummary(id)` | Task/event/maintenance counts for dashboard card |
| `createHome(data)` | Create home; creator becomes owner |
| `updateHome(id, data)` | Update (admin+ only) |
| `deleteHome(id)` | Delete (owner only) |
| `getMembers(homeId)` | List members with roles |
| `addMember(homeId, userId, role)` | Add member (admin+ only) |
| `updateMemberRole(homeId, userId, role)` | Change role (admin+ only) |
| `removeMember(homeId, userId)` | Remove member (admin+ only) |

---

## Tasks (`src/actions/tasks.ts`)

| Action | Description |
|--------|-------------|
| `getTasks(homeId, filters?)` | List tasks; filter by status, priority, completed |
| `getKanbanBoard(homeId)` | Tasks grouped by status column |
| `getTask(id)` | Single task with assignees |
| `createTask(data)` | Create task + notify assignees |
| `updateTask(id, data)` | Update task |
| `moveTask(id, status)` | Update status (kanban drag-drop) |
| `deleteTask(id)` | Delete task |

---

## Events (`src/actions/events.ts`)

| Action | Description |
|--------|-------------|
| `getEvents(homeId, filters?)` | List events; filter by month |
| `getEvent(id)` | Single event |
| `createEvent(data)` | Create event |
| `updateEvent(id, data)` | Update event |
| `deleteEvent(id)` | Delete event |
| `getCalendarData(homeId, start, end)` | Merged tasks + events for a date range (for calendar view) |

Each item in `getCalendarData` includes a `kind` field: `"task"` or `"event"`.

---

## Documents (`src/actions/documents.ts`)

| Action | Description |
|--------|-------------|
| `getDocuments(homeId, filters?)` | List documents; filter by category |
| `getDocument(id)` | Single document |
| `uploadDocument(formData)` | Upload file to `/uploads/` + save record |
| `updateDocument(id, data)` | Update metadata |
| `deleteDocument(id)` | Delete file + record |

File uploads use `FormData` passed to the server action.

---

## People (`src/actions/people.ts`)

| Action | Description |
|--------|-------------|
| `getPeople(homeId, filters?)` | List; filter by role |
| `getPerson(id)` | Single person |
| `createPerson(data)` | Create person |
| `updatePerson(id, data)` | Update person |
| `deletePerson(id)` | Delete person |
| `searchPeople(homeId, query)` | Search by name for @mention autocomplete |

---

## Vendors (`src/actions/vendors.ts`)

| Action | Description |
|--------|-------------|
| `getVendors(homeId?)` | List; filter by home |
| `getVendor(id)` | Single vendor |
| `createVendor(data)` | Create vendor |
| `updateVendor(id, data)` | Update vendor |
| `deleteVendor(id)` | Delete vendor |

---

## Maintenance (`src/actions/maintenance.ts`)

| Action | Description |
|--------|-------------|
| `getMaintenanceTasks(homeId)` | List tasks with computed status |
| `getMaintenanceTask(id)` | Single task |
| `createMaintenanceTask(data)` | Create task |
| `updateMaintenanceTask(id, data)` | Update task |
| `deleteMaintenanceTask(id)` | Delete task |

Computed `status` field returned on every task: `overdue` | `due_soon` | `on_track` | `no_schedule`.

---

## Home Info Sections (`src/actions/home-info.ts`)

All 8 sections follow the same pattern: `get{Section}(homeId)`, `create{Section}(data)`, `update{Section}(id, data)`, `delete{Section}(id)`.

| Section | Functions |
|---------|-----------|
| Service Providers | `getServiceProviders`, `createServiceProvider`, `updateServiceProvider`, `deleteServiceProvider` |
| Lock Codes | `getLockCodes`, `createLockCode`, `updateLockCode`, `deleteLockCode`, `revealLockCode` |
| Internet & Network | `getNetworks`, `createNetwork`, `updateNetwork`, `deleteNetwork`, `revealWifiPassword` |
| Appliance Warranties | `getWarranties`, `createWarranty`, `updateWarranty`, `deleteWarranty` |
| Important Contacts | `getContacts`, `createContact`, `updateContact`, `deleteContact` |
| Utility Bills | `getUtilities`, `createUtility`, `updateUtility`, `deleteUtility` |
| Smart Home Systems | `getSmartHomeSystems`, `createSmartHomeSystem`, `updateSmartHomeSystem`, `deleteSmartHomeSystem` |
| Emergency Info | `getEmergencyInfos`, `createEmergencyInfo`, `updateEmergencyInfo`, `deleteEmergencyInfo` |

### Sensitive Field Security

`revealLockCode(id)` and `revealWifiPassword(id)`:
- Requires manager+ role
- Decrypts field using AES-256
- Writes an `AccessLog` entry (userId, entityType, entityId, IP, timestamp)
- Returns `{ value, maskAfter }` where `maskAfter` is `Date.now() + 30_000`

Standard `getLockCodes` / `getNetworks` responses **never** include encrypted fields.

---

## Completion Logs (`src/actions/completion-logs.ts`)

| Action | Description |
|--------|-------------|
| `getCompletionLogs(entityType, entityId)` | List logs for a record; newest first |
| `createCompletionLog(data)` | Add log entry; recalculates `nextDue` for maintenance |
| `deleteCompletionLog(id)` | Delete entry; recalculates `nextDue` for maintenance |

Supported `entityType` values: `maintenance` | `event` | `network` | `warranty` | `contact` | `utility` | `smart_home` | `emergency` | `protocol`

---

## Access Logs (`src/actions/activity.ts`)

| Action | Description |
|--------|-------------|
| `getAccessLogs(homeId)` | List access logs; owner/admin only |

Read-only — no create, update, or delete.

---

## Activity Log (`src/actions/activity.ts`)

| Action | Description |
|--------|-------------|
| `getActivityLogs(homeId)` | List entries; newest first |
| `createActivityLog(data)` | Add entry; parses @mentions and fires notifications |
| `deleteActivityLog(id)` | Delete entry (author or admin+) |

---

## Bulletins (`src/actions/bulletins.ts`)

| Action | Description |
|--------|-------------|
| `getBulletins(homeId)` | List bulletins |
| `createBulletin(data)` | Create; notifies all home members |
| `updateBulletin(id, data)` | Update (author or admin+) |
| `deleteBulletin(id)` | Delete (author or admin+) |

---

## Protocols (`src/actions/protocols.ts`)

| Action | Description |
|--------|-------------|
| `getProtocols(homeId, category?)` | List protocols |
| `getProtocol(id)` | Single protocol |
| `createProtocol(data)` | Create protocol |
| `updateProtocol(id, data)` | Update protocol |
| `deleteProtocol(id)` | Delete protocol |

---

## Lists (`src/actions/lists.ts`)

| Action | Description |
|--------|-------------|
| `getLists(homeId)` | List checklists |
| `getList(id)` | List detail with items |
| `createList(data)` | Create list |
| `updateList(id, data)` | Update title |
| `deleteList(id)` | Delete list + items |
| `addListItem(listId, text)` | Add item |
| `updateListItem(id, data)` | Toggle done / edit text |
| `deleteListItem(id)` | Delete item |

---

## Notifications (`src/actions/notifications.ts`)

| Action | Description |
|--------|-------------|
| `getNotifications()` | Current user's notifications |
| `markRead(id)` | Mark single notification as read |
| `markAllRead()` | Mark all as read |
| `createNotification(data)` | Internal — called by other actions, not directly |

Notification triggers are called synchronously within the relevant action (e.g., `createTask` calls `createNotification` for each assignee).

Daily checks (maintenance overdue, warranty expiry, etc.) run via a Next.js cron route: `GET /api/cron/notifications` — called by Vercel Cron or an external scheduler.
