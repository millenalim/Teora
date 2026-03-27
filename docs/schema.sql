-- MiHomes PostgreSQL Schema
-- PostgreSQL 16

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- used for gen_random_uuid()

-- ─────────────────────────────────────────────
-- USERS & HOMES
-- ─────────────────────────────────────────────

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    display_name    VARCHAR(255) NOT NULL,
    azure_ad_id     VARCHAR(255) UNIQUE NOT NULL,   -- from Microsoft SSO
    avatar_color    VARCHAR(7),                      -- hex color for avatar
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE homes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    address         TEXT NOT NULL,
    sqft            INTEGER,
    lot_size        VARCHAR(100),                    -- e.g. "0.25 acres"
    purpose         VARCHAR(255),                    -- "Primary residence", "Vacation rental", etc.
    description     TEXT,
    color_tag       VARCHAR(7) NOT NULL DEFAULT '#6366f1',  -- hex color
    m365_group_id   VARCHAR(255) UNIQUE,             -- Azure AD group ID
    m365_plan_id    VARCHAR(255),                    -- Planner plan ID
    m365_calendar_id VARCHAR(255),                   -- Outlook group calendar ID
    m365_site_id    VARCHAR(255),                    -- SharePoint site ID
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TYPE home_role AS ENUM ('owner', 'admin', 'manager', 'viewer');

CREATE TABLE home_memberships (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    home_id     UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role        home_role NOT NULL DEFAULT 'viewer',
    joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (home_id, user_id)
);

-- M365 OAuth tokens per user (encrypted at rest via Django field-level encryption)
CREATE TABLE user_tokens (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    access_token    TEXT NOT NULL,       -- encrypted
    refresh_token   TEXT NOT NULL,       -- encrypted
    token_expiry    TIMESTAMPTZ NOT NULL,
    scope           TEXT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- PEOPLE (Residents, Staff, Contacts)
-- ─────────────────────────────────────────────

CREATE TYPE person_role AS ENUM ('resident', 'staff', 'contact');

CREATE TABLE people (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    home_id         UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    role            person_role NOT NULL,
    phone           VARCHAR(50),
    email           VARCHAR(255),
    company         VARCHAR(255),
    notes           TEXT,
    m365_user_id    UUID REFERENCES users(id) ON DELETE SET NULL,  -- linked MiHomes/M365 user
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- VENDORS
-- ─────────────────────────────────────────────

CREATE TABLE vendors (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name    VARCHAR(255) NOT NULL,
    service_type    VARCHAR(255),
    phone           VARCHAR(50),
    email           VARCHAR(255),
    website         VARCHAR(500),
    pricing         TEXT,
    quote_amount    NUMERIC(10, 2),
    rating          SMALLINT CHECK (rating BETWEEN 1 AND 5),
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Many-to-many: vendors serve multiple homes
CREATE TABLE vendor_homes (
    vendor_id   UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    home_id     UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
    PRIMARY KEY (vendor_id, home_id)
);

-- ─────────────────────────────────────────────
-- TASKS (Planner proxy)
-- ─────────────────────────────────────────────

CREATE TYPE task_status AS ENUM ('todo', 'inprogress', 'review', 'done');
CREATE TYPE task_priority AS ENUM ('high', 'medium', 'low');

CREATE TABLE tasks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    home_id         UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
    planner_task_id VARCHAR(255) UNIQUE,     -- Microsoft Planner task ID
    planner_bucket  VARCHAR(255),            -- bucket ID in Planner
    subject         VARCHAR(500) NOT NULL,
    description     TEXT,
    status          task_status NOT NULL DEFAULT 'todo',
    priority        task_priority NOT NULL DEFAULT 'medium',
    start_date      DATE,
    end_date        DATE,
    created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
    synced_at       TIMESTAMPTZ,             -- last successful Graph sync
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE task_assignees (
    task_id     UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, user_id)
);

-- ─────────────────────────────────────────────
-- EVENTS (Outlook Calendar proxy)
-- ─────────────────────────────────────────────

CREATE TABLE events (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    home_id             UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
    outlook_event_id    VARCHAR(255) UNIQUE,     -- Microsoft Graph event ID
    title               VARCHAR(500) NOT NULL,
    assignee_id         UUID REFERENCES people(id) ON DELETE SET NULL,
    start_date          DATE,
    end_date            DATE,
    start_time          TIME,
    notes               TEXT,
    synced_at           TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- DOCUMENTS (SharePoint metadata)
-- ─────────────────────────────────────────────

CREATE TYPE document_category AS ENUM (
    'contract', 'insurance', 'manual', 'protocol', 'receipt', 'tax', 'other'
);

CREATE TABLE documents (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    home_id             UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
    title               VARCHAR(500) NOT NULL,
    category            document_category NOT NULL DEFAULT 'other',
    sharepoint_url      TEXT,                    -- direct link to SharePoint/OneDrive
    sharepoint_item_id  VARCHAR(255),            -- Graph item ID for management
    doc_date            DATE,
    notes               TEXT,
    uploaded_by         UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- MAINTENANCE
-- ─────────────────────────────────────────────

CREATE TYPE maintenance_frequency AS ENUM (
    'weekly', 'biweekly', 'monthly', 'quarterly',
    'semiannually', 'annually', 'as_needed'
);

CREATE TABLE maintenance_tasks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    home_id         UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
    task_name       VARCHAR(255) NOT NULL,
    frequency       maintenance_frequency NOT NULL DEFAULT 'as_needed',
    provider        VARCHAR(255),
    estimated_cost  NUMERIC(10, 2),
    notes           TEXT,
    next_due        DATE,                    -- auto-calculated from last completion + frequency
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- HOME INFO SECTIONS
-- ─────────────────────────────────────────────

CREATE TABLE service_providers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    home_id         UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    service_type    VARCHAR(255),
    phone           VARCHAR(50),
    email           VARCHAR(255),
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TYPE lock_type AS ENUM ('keypad', 'smart_lock', 'gate', 'garage', 'key_safe', 'other');

CREATE TABLE lock_codes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    home_id         UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
    location        VARCHAR(255) NOT NULL,
    code_encrypted  TEXT NOT NULL,       -- AES-256 encrypted; never returned in standard API
    lock_type       lock_type NOT NULL DEFAULT 'other',
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE internet_network (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    home_id                 UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
    provider                VARCHAR(255),
    account_number          VARCHAR(255),
    plan_details            TEXT,
    wifi_name               VARCHAR(255),
    wifi_password_encrypted TEXT,           -- AES-256 encrypted
    router_ip               VARCHAR(50),
    notes                   TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE appliance_warranties (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    home_id             UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
    appliance           VARCHAR(255) NOT NULL,
    brand               VARCHAR(255),
    model               VARCHAR(255),
    serial_number       VARCHAR(255),
    purchase_date       DATE,
    warranty_expiry     DATE,
    purchased_from      VARCHAR(255),
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TYPE contact_type AS ENUM (
    'hoa', 'home_insurance', 'landlord', 'property_manager', 'mortgage_co',
    'pest_control', 'landscaping', 'pool_service', 'security_co', 'other'
);

CREATE TABLE important_contacts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    home_id         UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    contact_type    contact_type NOT NULL DEFAULT 'other',
    phone           VARCHAR(50),
    email           VARCHAR(255),
    account_number  VARCHAR(255),
    policy_number   VARCHAR(255),
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TYPE utility_type AS ENUM (
    'electric', 'gas', 'water', 'sewer', 'trash', 'internet', 'solar', 'other'
);

CREATE TABLE utility_bills (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    home_id             UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
    utility_type        utility_type NOT NULL,
    provider            VARCHAR(255),
    account_number      VARCHAR(255),
    avg_monthly_cost    NUMERIC(10, 2),
    due_date            VARCHAR(50),            -- e.g. "15th of each month"
    autopay             BOOLEAN NOT NULL DEFAULT FALSE,
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE smart_home_systems (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    home_id             UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
    system_name         VARCHAR(255) NOT NULL,
    app_name            VARCHAR(255),
    hub_model           VARCHAR(255),
    account_email       VARCHAR(255),
    connected_devices   TEXT,
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE emergency_info (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    home_id     UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
    item        VARCHAR(255) NOT NULL,       -- e.g. "Main water shutoff"
    location    VARCHAR(500),
    details     TEXT,
    notes       TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- COMPLETION LOGS (polymorphic)
-- ─────────────────────────────────────────────

CREATE TABLE completion_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type     VARCHAR(50) NOT NULL,    -- "maintenance", "event", "warranty", "network",
                                             -- "contact", "utility", "smart_home", "emergency", "protocol"
    entity_id       UUID NOT NULL,
    home_id         UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
    completed_date  DATE NOT NULL,
    completed_by    UUID REFERENCES people(id) ON DELETE SET NULL,
    cost            VARCHAR(100),            -- free text: "$150", "included in contract"
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_completion_logs_entity ON completion_logs (entity_type, entity_id);
CREATE INDEX idx_completion_logs_home ON completion_logs (home_id);

-- ─────────────────────────────────────────────
-- SENSITIVE DATA ACCESS LOG (read-only audit)
-- ─────────────────────────────────────────────

CREATE TABLE access_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    home_id         UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entity_type     VARCHAR(50) NOT NULL,    -- "lock_code", "wifi_password"
    entity_id       UUID NOT NULL,
    ip_address      INET,
    user_agent      TEXT,
    accessed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    -- No UPDATE or DELETE allowed — enforced at app level and via DB permissions
);

CREATE INDEX idx_access_logs_home ON access_logs (home_id);
CREATE INDEX idx_access_logs_user ON access_logs (user_id);

-- ─────────────────────────────────────────────
-- COMMUNICATION & COLLABORATION
-- ─────────────────────────────────────────────

CREATE TABLE bulletins (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    home_id     UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
    title       VARCHAR(500) NOT NULL,
    content     TEXT NOT NULL,
    author_id   UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE activity_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    home_id     UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
    author_id   UUID REFERENCES users(id) ON DELETE SET NULL,
    content     TEXT NOT NULL,              -- raw text with @Name mentions
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_home ON activity_logs (home_id, created_at DESC);

CREATE TYPE protocol_category AS ENUM (
    'emergency', 'cleaning', 'opening_closing', 'security', 'guest', 'maintenance', 'other'
);

CREATE TABLE protocols (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    home_id             UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
    title               VARCHAR(500) NOT NULL,
    category            protocol_category NOT NULL DEFAULT 'other',
    content             TEXT,
    linked_doc_name     VARCHAR(255),
    linked_doc_url      TEXT,
    last_reviewed_date  DATE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE lists (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    home_id     UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
    title       VARCHAR(255) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE list_items (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    list_id     UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    text        TEXT NOT NULL,
    done        BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- NOTIFICATIONS
-- ─────────────────────────────────────────────

CREATE TYPE notification_type AS ENUM (
    'maintenance_overdue', 'maintenance_due_soon',
    'warranty_expiring', 'task_assigned', 'task_due_soon',
    'event_reminder', 'bulletin_posted', 'mention'
);

CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    home_id         UUID REFERENCES homes(id) ON DELETE CASCADE,
    type            notification_type NOT NULL,
    title           VARCHAR(500) NOT NULL,
    body            TEXT,
    entity_type     VARCHAR(50),            -- "maintenance", "task", etc.
    entity_id       UUID,                   -- FK to the related record
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications (user_id, is_read, created_at DESC);
