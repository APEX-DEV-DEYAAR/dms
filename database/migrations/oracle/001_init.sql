-- Letterhead Control System - Oracle Initial Schema
-- Equivalent of PostgreSQL 001_init.sql through 006_expand_letterhead_versions.sql
-- NOTE: This is a stub. Review and test thoroughly before running against a real Oracle instance.

-- Departments
CREATE TABLE departments (
  id              NUMBER(19)      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code            VARCHAR2(10)    NOT NULL UNIQUE,
  name            VARCHAR2(200)   NOT NULL,
  prefix          VARCHAR2(20)    NOT NULL UNIQUE,
  next_sequence   NUMBER(19)      DEFAULT 1 NOT NULL,
  is_active       NUMBER(1)       DEFAULT 1 NOT NULL,
  created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Users
CREATE TABLE users (
  id              NUMBER(19)      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  username        VARCHAR2(100)   NOT NULL UNIQUE,
  password_hash   VARCHAR2(500)   NOT NULL,
  display_name    VARCHAR2(200)   NOT NULL,
  email           VARCHAR2(200),
  department_id   NUMBER(19)      REFERENCES departments(id),
  role            VARCHAR2(30)    DEFAULT 'department_user' NOT NULL
                  CONSTRAINT chk_user_role CHECK (role IN ('department_user', 'compliance', 'ceo_office', 'admin')),
  is_active       NUMBER(1)       DEFAULT 1 NOT NULL,
  created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Letterheads
CREATE TABLE letterheads (
  id                  NUMBER(19)      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  department_id       NUMBER(19)      NOT NULL REFERENCES departments(id),
  reference_number    VARCHAR2(30)    NOT NULL UNIQUE,
  letter_date         DATE            NOT NULL,
  approval_authority  VARCHAR2(200)   NOT NULL,
  description         VARCHAR2(2000),
  notes               VARCHAR2(2000),
  file_name           VARCHAR2(500)   NOT NULL,
  file_path           VARCHAR2(1000)  NOT NULL,
  file_size_bytes     NUMBER(19),
  mime_type           VARCHAR2(100)   DEFAULT 'application/pdf',
  created_by          NUMBER(19)      NOT NULL REFERENCES users(id),
  updated_by          NUMBER(19)      REFERENCES users(id),
  created_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP NOT NULL,
  is_archived         NUMBER(1)       DEFAULT 0 NOT NULL,
  archived_at         TIMESTAMP,
  archived_by         NUMBER(19)      REFERENCES users(id),
  archive_reference   VARCHAR2(100),
  current_version     NUMBER(10)      DEFAULT 1 NOT NULL
);

CREATE INDEX idx_letterheads_department ON letterheads (department_id, created_at DESC);
CREATE INDEX idx_letterheads_reference  ON letterheads (reference_number);
CREATE INDEX idx_letterheads_date       ON letterheads (letter_date DESC);

-- Description full-text index (Oracle Text)
-- CREATE INDEX idx_letterheads_desc ON letterheads(description) INDEXTYPE IS CTXSYS.CONTEXT;

-- Letterhead versions
CREATE TABLE letterhead_versions (
  id                  NUMBER(19)      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  letterhead_id       NUMBER(19)      NOT NULL REFERENCES letterheads(id),
  version_number      NUMBER(10)      NOT NULL,
  department_id       NUMBER(19),
  reference_number    VARCHAR2(30),
  letter_date         DATE,
  approval_authority  VARCHAR2(200),
  description         VARCHAR2(2000),
  notes               VARCHAR2(2000),
  file_name           VARCHAR2(500),
  file_path           VARCHAR2(1000),
  file_size_bytes     NUMBER(19),
  mime_type           VARCHAR2(100),
  created_by          NUMBER(19),
  original_created_at TIMESTAMP,
  original_updated_at TIMESTAMP,
  modified_by         NUMBER(19)      NOT NULL REFERENCES users(id),
  modified_at         TIMESTAMP       DEFAULT CURRENT_TIMESTAMP NOT NULL,
  change_summary      VARCHAR2(2000),
  archive_reason      VARCHAR2(2000),
  archived_file_path  VARCHAR2(1000),
  CONSTRAINT uq_letterhead_version UNIQUE (letterhead_id, version_number)
);

-- Letterhead archives
CREATE TABLE letterhead_archives (
  id                  NUMBER(19)      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  letterhead_id       NUMBER(19)      NOT NULL REFERENCES letterheads(id),
  archive_reference   VARCHAR2(100)   NOT NULL,
  storage_location    VARCHAR2(1000)  NOT NULL,
  archived_by         NUMBER(19)      NOT NULL REFERENCES users(id),
  archived_at         TIMESTAMP       DEFAULT CURRENT_TIMESTAMP NOT NULL,
  retention_until     DATE            NOT NULL,
  metadata            CLOB
);

-- Audit log
CREATE TABLE audit_log (
  id              NUMBER(19)      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  entity_type     VARCHAR2(50)    NOT NULL,
  entity_id       NUMBER(19)      NOT NULL,
  action          VARCHAR2(30)    NOT NULL,
  performed_by    NUMBER(19)      NOT NULL REFERENCES users(id),
  details         VARCHAR2(2000),
  created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_audit_log_entity ON audit_log (entity_type, entity_id);

-- Schema migrations tracking
CREATE TABLE schema_migrations (
  id          NUMBER(19)      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  filename    VARCHAR2(500)   NOT NULL UNIQUE,
  executed_at TIMESTAMP       DEFAULT CURRENT_TIMESTAMP NOT NULL
);
