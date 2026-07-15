-- ============================================================================
-- 1. TENANCY & STRUCTURE ENGINE
-- ============================================================================

CREATE TABLE companies (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE departments (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 2. IDENTITY & IDENTITY POLICIES
-- ============================================================================

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    department_id BIGINT REFERENCES departments(id) ON DELETE SET NULL, -- NULL if a standard employee
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, -- EMPLOYEE, AGENT, DEPT_MANAGER, SYS_ADMIN
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sla_rules (
    id BIGSERIAL PRIMARY KEY,
    department_id BIGINT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    priority VARCHAR(50) NOT NULL, -- LOW, MEDIUM, HIGH, CRITICAL
    target_resolution_hours INT NOT NULL,
    UNIQUE(department_id, priority)
);

-- ============================================================================
-- 3. TICKETING CORE & THREADS
-- ============================================================================

CREATE TABLE tickets (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    department_id BIGINT REFERENCES departments(id) ON DELETE CASCADE,
    creator_id BIGINT NOT NULL REFERENCES users(id),
    assignee_id BIGINT REFERENCES users(id) ON DELETE SET NULL, -- NULL implies unassigned in pool
    parent_id BIGINT REFERENCES tickets(id) ON DELETE CASCADE, -- Self-reference for multi-department splits
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN',
    CONSTRAINT tickets_status_check CHECK (status IN ('OPEN','IN_PROGRESS','PENDING_EMPLOYEE','PENDING_APPROVAL','RESOLVED','CLOSED')),
    priority VARCHAR(50) NOT NULL DEFAULT 'MEDIUM',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    due_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE ticket_messages (
    id BIGSERIAL PRIMARY KEY,
    ticket_id BIGINT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    sender_id BIGINT NOT NULL REFERENCES users(id),
    body TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 4. OBJECT REFERENCES & INTELLIGENCE AUDITING
-- ============================================================================

CREATE TABLE attachments (
    id BIGSERIAL PRIMARY KEY,
    ticket_id BIGINT REFERENCES tickets(id) ON DELETE CASCADE,
    message_id BIGINT REFERENCES ticket_messages(id) ON DELETE CASCADE, -- NULL if added on ticket creation
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL, -- e.g., image/png, application/pdf
    file_size INT NOT NULL,          -- Stored in bytes for validation checks
    secure_url TEXT NOT NULL,        -- S3 / Object Storage bucket locator string
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ai_classification_logs (
    id BIGSERIAL PRIMARY KEY,
    ticket_id BIGINT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    raw_text TEXT NOT NULL,
    predicted_department_id BIGINT REFERENCES departments(id),
    actual_department_id BIGINT REFERENCES departments(id),
    confidence_score NUMERIC(5,2),
    is_misclassified BOOLEAN DEFAULT FALSE,
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 5. NOTIFICATION CENTER
-- ============================================================================

CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    recipient_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ticket_id    BIGINT REFERENCES tickets(id) ON DELETE CASCADE,
    type         VARCHAR(50) NOT NULL, -- COMMENT, ASSIGNED, SLA_BREACH, SYSTEM
    message      TEXT NOT NULL,
    is_read      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 6. PERFORMANCE DEPLOYMENT INDEXES
-- ============================================================================
CREATE INDEX idx_tickets_company_dept    ON tickets(company_id, department_id);
CREATE INDEX idx_tickets_assignee        ON tickets(assignee_id);
CREATE INDEX idx_tickets_status          ON tickets(status);
CREATE INDEX idx_messages_ticket         ON ticket_messages(ticket_id);
CREATE INDEX idx_attachments_ticket      ON attachments(ticket_id);
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX idx_notifications_unread    ON notifications(recipient_id, is_read);

-- ============================================================================
-- 7. CASCADING CONSTRAINT MIGRATIONS (Department Deletion Rules)
-- ============================================================================

-- Users: downgrade to EMPLOYEE + NULL department when a division is deleted
--        (already ON DELETE SET NULL in CREATE TABLE; ALTER ensures enforcement
--         if the schema was previously deployed with a stricter constraint)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_department_id_fkey;
ALTER TABLE users ADD CONSTRAINT fk_users_department
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;

-- Tickets: fully wipe all ticket rows belonging to a deleted department
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_department_id_fkey;
ALTER TABLE tickets ADD CONSTRAINT fk_tickets_department
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE;
