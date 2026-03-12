-- Letterhead Control System - Initial Schema
-- Designed for PostgreSQL with Oracle migration compatibility

CREATE TABLE IF NOT EXISTS departments (
  id              BIGSERIAL       PRIMARY KEY,
  code            VARCHAR(10)     NOT NULL UNIQUE,
  name            VARCHAR(200)    NOT NULL,
  prefix          VARCHAR(20)     NOT NULL UNIQUE,
  next_sequence   BIGINT          NOT NULL DEFAULT 1,
  is_active       SMALLINT        NOT NULL DEFAULT 1,
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id              BIGSERIAL       PRIMARY KEY,
  username        VARCHAR(100)    NOT NULL UNIQUE,
  password_hash   VARCHAR(500)    NOT NULL,
  display_name    VARCHAR(200)    NOT NULL,
  email           VARCHAR(200),
  department_id   BIGINT          REFERENCES departments(id),
  role            VARCHAR(30)     NOT NULL DEFAULT 'department_user'
                  CHECK (role IN ('department_user', 'compliance', 'ceo_office', 'admin')),
  is_active       SMALLINT        NOT NULL DEFAULT 1,
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS letterheads (
  id                  BIGSERIAL       PRIMARY KEY,
  department_id       BIGINT          NOT NULL REFERENCES departments(id),
  reference_number    VARCHAR(30)     NOT NULL UNIQUE,
  letter_date         DATE            NOT NULL,
  approval_authority  VARCHAR(200)    NOT NULL,
  notes               VARCHAR(2000),
  file_name           VARCHAR(500)    NOT NULL,
  file_path           VARCHAR(1000)   NOT NULL,
  file_size_bytes     BIGINT,
  mime_type           VARCHAR(100)    DEFAULT 'application/pdf',
  created_by          BIGINT          NOT NULL REFERENCES users(id),
  created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_letterheads_department
  ON letterheads (department_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_letterheads_reference
  ON letterheads (reference_number);

CREATE INDEX IF NOT EXISTS idx_letterheads_date
  ON letterheads (letter_date DESC);

CREATE TABLE IF NOT EXISTS audit_log (
  id              BIGSERIAL       PRIMARY KEY,
  entity_type     VARCHAR(50)     NOT NULL,
  entity_id       BIGINT          NOT NULL,
  action          VARCHAR(30)     NOT NULL,
  performed_by    BIGINT          NOT NULL REFERENCES users(id),
  details         VARCHAR(2000),
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_log_entity
  ON audit_log (entity_type, entity_id);
