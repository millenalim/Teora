-- MiHomes Database Schema
-- SQLite (Django ORM manages migrations — this is a reference document)
-- Integer PKs used (SQLite auto-increment)

-- ─────────────────────────────────────────────
-- USERS & HOMES
-- ─────────────────────────────────────────────

-- accounts_user (extends Django AbstractUser)
CREATE TABLE accounts_user (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    username        VARCHAR(150) UNIQUE NOT NULL,
    email           VARCHAR(254) UNIQUE NOT NULL,
    full_name       VARCHAR(255) NOT NULL DEFAULT '',
    avatar_url      VARCHAR(500),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    is_staff        BOOLEAN NOT NULL DEFAULT FALSE,
    date_joined     DATETIME NOT NULL,
    password        VARCHAR(128) NOT NULL   -- Django hashed password
);

CREATE TABLE homes_home (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        VARCHAR(255) NOT NULL,
    address     TEXT NOT NULL,
    sqft        INTEGER,
    lot_size    VARCHAR(100),           -- e.g. "0.25 acres"
    purpose     VARCHAR(255),           -- "Primary residence", "Vacation rental", etc.
    description TEXT,
    color_tag   VARCHAR(7) NOT NULL DEFAULT '#6366f1',  -- hex color
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  DATETIME NOT NULL,
    updated_at  DATETIME NOT NULL
);

-- Role choices enforced at application level: owner, admin, manager, viewer
CREATE TABLE homes_homemember (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    home_id     INTEGER NOT NULL REFERENCES homes_home(id) ON DELETE CASCADE,
    user_id     INTEGER NOT NULL REFERENCES accounts_user(id) ON DELETE CASCADE,
    role        VARCHAR(10) NOT NULL DEFAULT 'viewer',
    joined_at   DATETIME NOT NULL,
    UNIQUE (home_id, user_id)
);

-- ─────────────────────────────────────────────
-- PEOPLE (Residents, Staff, Contacts)
-- ─────────────────────────────────────────────

-- Role choices: resident, staff, contact
CREATE TABLE people_person (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    home_id     INTEGER NOT NULL REFERENCES homes_home(id) ON DELETE CASCADE,
    name        VARCHAR(255) NOT NULL,
    role        VARCHAR(10) NOT NULL,
    phone       VARCHAR(50),
    email       VARCHAR(255),
    company     VARCHAR(255),
    notes       TEXT,
    user_id     INTEGER REFERENCES accounts_user(id) ON DELETE SET NULL,  -- linked app user
    created_at  DATETIME NOT NULL,
    updated_at  DATETIME NOT NULL
);

-- ─────────────────────────────────────────────
-- VENDORS
-- ─────────────────────────────────────────────

CREATE TABLE vendors_vendor (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    company_name    VARCHAR(255) NOT NULL,
    service_type    VARCHAR(255),
    phone           VARCHAR(50),
    email           VARCHAR(255),
    website         VARCHAR(500),
    pricing         TEXT,
    quote_amount    DECIMAL(10, 2),
    rating          INTEGER CHECK (rating BETWEEN 1 AND 5),
    notes           TEXT,
    created_at      DATETIME NOT NULL,
    updated_at      DATETIME NOT NULL
);

-- Many-to-many: vendors serve multiple homes
CREATE TABLE vendors_vendorhome (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    vendor_id   INTEGER NOT NULL REFERENCES vendors_vendor(id) ON DELETE CASCADE,
    home_id     INTEGER NOT NULL REFERENCES homes_home(id) ON DELETE CASCADE,
    UNIQUE (vendor_id, home_id)
);

-- ─────────────────────────────────────────────
-- TASKS
-- ─────────────────────────────────────────────

-- Status choices: todo, inprogress, review, done
-- Priority choices: high, medium, low
CREATE TABLE tasks_task (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    home_id     INTEGER NOT NULL REFERENCES homes_home(id) ON DELETE CASCADE,
    title       VARCHAR(500) NOT NULL,
    description TEXT,
    status      VARCHAR(12) NOT NULL DEFAULT 'todo',
    priority    VARCHAR(6) NOT NULL DEFAULT 'medium',
    start_date  DATE,
    end_date    DATE,
    created_by_id INTEGER REFERENCES accounts_user(id) ON DELETE SET NULL,
    created_at  DATETIME NOT NULL,
    updated_at  DATETIME NOT NULL
);

CREATE TABLE tasks_taskassignee (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id     INTEGER NOT NULL REFERENCES tasks_task(id) ON DELETE CASCADE,
    person_id   INTEGER NOT NULL REFERENCES people_person(id) ON DELETE CASCADE,
    UNIQUE (task_id, person_id)
);

-- ─────────────────────────────────────────────
-- EVENTS
-- ─────────────────────────────────────────────

CREATE TABLE events_event (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    home_id         INTEGER NOT NULL REFERENCES homes_home(id) ON DELETE CASCADE,
    title           VARCHAR(500) NOT NULL,
    assignee_id     INTEGER REFERENCES people_person(id) ON DELETE SET NULL,
    start_date      DATE,
    end_date        DATE,
    start_time      TIME,
    notes           TEXT,
    created_at      DATETIME NOT NULL,
    updated_at      DATETIME NOT NULL
);

-- ─────────────────────────────────────────────
-- DOCUMENTS
-- ─────────────────────────────────────────────

-- Category choices: contract, insurance, manual, protocol, receipt, tax, other
CREATE TABLE documents_document (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    home_id     INTEGER NOT NULL REFERENCES homes_home(id) ON DELETE CASCADE,
    title       VARCHAR(500) NOT NULL,
    category    VARCHAR(20) NOT NULL DEFAULT 'other',
    file        VARCHAR(500) NOT NULL,  -- Django FileField path under /media/
    notes       TEXT,
    doc_date    DATE,
    uploaded_by_id INTEGER REFERENCES accounts_user(id) ON DELETE SET NULL,
    created_at  DATETIME NOT NULL,
    updated_at  DATETIME NOT NULL
);

-- ─────────────────────────────────────────────
-- MAINTENANCE
-- ─────────────────────────────────────────────

-- Frequency choices: weekly, biweekly, monthly, quarterly, semiannually, annually, as_needed
CREATE TABLE maintenance_maintenancetask (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    home_id         INTEGER NOT NULL REFERENCES homes_home(id) ON DELETE CASCADE,
    task_name       VARCHAR(255) NOT NULL,
    frequency       VARCHAR(15) NOT NULL DEFAULT 'as_needed',
    provider        VARCHAR(255),
    estimated_cost  DECIMAL(10, 2),
    notes           TEXT,
    next_due        DATE,   -- auto-calculated from last completion + frequency
    created_at      DATETIME NOT NULL,
    updated_at      DATETIME NOT NULL
);

-- ─────────────────────────────────────────────
-- HOME INFO SECTIONS
-- ─────────────────────────────────────────────

CREATE TABLE home_info_serviceprovider (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    home_id         INTEGER NOT NULL REFERENCES homes_home(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    service_type    VARCHAR(255),
    phone           VARCHAR(50),
    email           VARCHAR(255),
    notes           TEXT,
    created_at      DATETIME NOT NULL,
    updated_at      DATETIME NOT NULL
);

-- Lock type choices: smart_lock, keypad, gate, garage, lockbox, other
CREATE TABLE home_info_lockcode (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    home_id         INTEGER NOT NULL REFERENCES homes_home(id) ON DELETE CASCADE,
    location        VARCHAR(255) NOT NULL,
    code_encrypted  TEXT NOT NULL,  -- AES-256 encrypted; never returned in standard API
    lock_type       VARCHAR(12) NOT NULL DEFAULT 'other',
    notes           TEXT,
    created_at      DATETIME NOT NULL,
    updated_at      DATETIME NOT NULL
);

CREATE TABLE home_info_internetnetwork (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    home_id                 INTEGER NOT NULL REFERENCES homes_home(id) ON DELETE CASCADE,
    provider                VARCHAR(255),
    account_number          VARCHAR(255),
    plan_details            TEXT,
    wifi_name               VARCHAR(255),
    wifi_password_encrypted TEXT,   -- AES-256 encrypted
    router_ip               VARCHAR(50),
    notes                   TEXT,
    created_at              DATETIME NOT NULL,
    updated_at              DATETIME NOT NULL
);

CREATE TABLE home_info_appliancewarranty (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    home_id         INTEGER NOT NULL REFERENCES homes_home(id) ON DELETE CASCADE,
    appliance       VARCHAR(255) NOT NULL,
    brand           VARCHAR(255),
    model           VARCHAR(255),
    serial_number   VARCHAR(255),
    purchase_date   DATE,
    warranty_expiry DATE,
    purchased_from  VARCHAR(255),
    notes           TEXT,
    created_at      DATETIME NOT NULL,
    updated_at      DATETIME NOT NULL
);

-- Contact type choices: hoa, insurance, mortgage, pest_control, landscaping, pool, security, other
CREATE TABLE home_info_importantcontact (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    home_id         INTEGER NOT NULL REFERENCES homes_home(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    contact_type    VARCHAR(15) NOT NULL DEFAULT 'other',
    phone           VARCHAR(50),
    email           VARCHAR(255),
    account_number  VARCHAR(255),
    policy_number   VARCHAR(255),
    notes           TEXT,
    created_at      DATETIME NOT NULL,
    updated_at      DATETIME NOT NULL
);

-- Utility type choices: electric, gas, water, sewer, trash, internet, solar, other
CREATE TABLE home_info_utilitybill (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    home_id             INTEGER NOT NULL REFERENCES homes_home(id) ON DELETE CASCADE,
    utility_type        VARCHAR(10) NOT NULL,
    provider            VARCHAR(255),
    account_number      VARCHAR(255),
    avg_monthly_cost    DECIMAL(10, 2),
    due_date            VARCHAR(50),    -- e.g. "15th of each month"
    autopay             BOOLEAN NOT NULL DEFAULT FALSE,
    notes               TEXT,
    created_at          DATETIME NOT NULL,
    updated_at          DATETIME NOT NULL
);

CREATE TABLE home_info_smarthomesystem (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    home_id             INTEGER NOT NULL REFERENCES homes_home(id) ON DELETE CASCADE,
    system_name         VARCHAR(255) NOT NULL,
    app_name            VARCHAR(255),
    hub_model           VARCHAR(255),
    account_email       VARCHAR(255),
    connected_devices   TEXT,
    notes               TEXT,
    created_at          DATETIME NOT NULL,
    updated_at          DATETIME NOT NULL
);

CREATE TABLE home_info_emergencyinfo (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    home_id     INTEGER NOT NULL REFERENCES homes_home(id) ON DELETE CASCADE,
    item        VARCHAR(255) NOT NULL,   -- e.g. "Main water shutoff"
    location    VARCHAR(500),
    details     TEXT,
    notes       TEXT,
    created_at  DATETIME NOT NULL,
    updated_at  DATETIME NOT NULL
);

-- ─────────────────────────────────────────────
-- COMPLETION LOGS (polymorphic)
-- ─────────────────────────────────────────────

-- entity_type values: maintenance, event, network, warranty, contact,
--                     utility, smart_home, emergency, protocol
CREATE TABLE shared_completionlog (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type     VARCHAR(50) NOT NULL,
    entity_id       INTEGER NOT NULL,
    home_id         INTEGER NOT NULL REFERENCES homes_home(id) ON DELETE CASCADE,
    completed_date  DATE NOT NULL,
    completed_by_id INTEGER REFERENCES people_person(id) ON DELETE SET NULL,
    cost            VARCHAR(100),   -- free text: "$150", "included in contract"
    notes           TEXT,
    created_at      DATETIME NOT NULL
);

CREATE INDEX idx_completion_logs_entity ON shared_completionlog (entity_type, entity_id);
CREATE INDEX idx_completion_logs_home ON shared_completionlog (home_id);

-- ─────────────────────────────────────────────
-- SENSITIVE DATA ACCESS LOG (read-only audit)
-- ─────────────────────────────────────────────

-- entity_type values: lock_code, wifi_password
-- No UPDATE or DELETE allowed — enforced at application level
CREATE TABLE home_info_accesslog (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    home_id         INTEGER NOT NULL REFERENCES homes_home(id) ON DELETE CASCADE,
    user_id         INTEGER NOT NULL REFERENCES accounts_user(id) ON DELETE CASCADE,
    entity_type     VARCHAR(20) NOT NULL,
    entity_id       INTEGER NOT NULL,
    ip_address      VARCHAR(45),
    user_agent      TEXT,
    accessed_at     DATETIME NOT NULL
);

CREATE INDEX idx_access_logs_home ON home_info_accesslog (home_id);
CREATE INDEX idx_access_logs_user ON home_info_accesslog (user_id);

-- ─────────────────────────────────────────────
-- COMMUNICATION & COLLABORATION
-- ─────────────────────────────────────────────

CREATE TABLE bulletins_bulletin (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    home_id     INTEGER NOT NULL REFERENCES homes_home(id) ON DELETE CASCADE,
    title       VARCHAR(500) NOT NULL,
    content     TEXT NOT NULL,
    author_id   INTEGER REFERENCES accounts_user(id) ON DELETE SET NULL,
    created_at  DATETIME NOT NULL,
    updated_at  DATETIME NOT NULL
);

CREATE TABLE activity_activitylog (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    home_id     INTEGER NOT NULL REFERENCES homes_home(id) ON DELETE CASCADE,
    author_id   INTEGER REFERENCES accounts_user(id) ON DELETE SET NULL,
    content     TEXT NOT NULL,  -- raw text with @Name mentions
    created_at  DATETIME NOT NULL
);

CREATE INDEX idx_activity_logs_home ON activity_activitylog (home_id, created_at DESC);

-- Category choices: emergency, cleaning, opening_closing, security, guest, maintenance, other
CREATE TABLE protocols_protocol (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    home_id             INTEGER NOT NULL REFERENCES homes_home(id) ON DELETE CASCADE,
    title               VARCHAR(500) NOT NULL,
    category            VARCHAR(20) NOT NULL DEFAULT 'other',
    content             TEXT,
    linked_doc_name     VARCHAR(255),
    last_reviewed_date  DATE,
    created_at          DATETIME NOT NULL,
    updated_at          DATETIME NOT NULL
);

CREATE TABLE lists_list (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    home_id     INTEGER NOT NULL REFERENCES homes_home(id) ON DELETE CASCADE,
    title       VARCHAR(255) NOT NULL,
    created_at  DATETIME NOT NULL,
    updated_at  DATETIME NOT NULL
);

CREATE TABLE lists_listitem (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    list_id     INTEGER NOT NULL REFERENCES lists_list(id) ON DELETE CASCADE,
    text        TEXT NOT NULL,
    done        BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  DATETIME NOT NULL
);

-- ─────────────────────────────────────────────
-- NOTIFICATIONS
-- ─────────────────────────────────────────────

-- Type choices: maintenance_overdue, maintenance_due_soon, warranty_expiring,
--               task_assigned, task_due_soon, event_reminder, bulletin_posted, mention
CREATE TABLE notifications_notification (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL REFERENCES accounts_user(id) ON DELETE CASCADE,
    home_id         INTEGER REFERENCES homes_home(id) ON DELETE CASCADE,
    type            VARCHAR(25) NOT NULL,
    title           VARCHAR(500) NOT NULL,
    body            TEXT,
    entity_type     VARCHAR(50),    -- "maintenance", "task", etc.
    entity_id       INTEGER,        -- ID of the related record
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      DATETIME NOT NULL
);

CREATE INDEX idx_notifications_user ON notifications_notification (user_id, is_read, created_at DESC);
