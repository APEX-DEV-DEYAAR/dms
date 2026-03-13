-- Add archive and edit tracking fields to letterheads

-- Add archive fields
ALTER TABLE letterheads 
ADD COLUMN IF NOT EXISTS is_archived SMALLINT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS archived_by BIGINT REFERENCES users(id),
ADD COLUMN IF NOT EXISTS archive_reference VARCHAR(100),
ADD COLUMN IF NOT EXISTS updated_by BIGINT REFERENCES users(id);

-- Add edit tracking field for description/notes edits
ALTER TABLE letterheads 
ADD COLUMN IF NOT EXISTS edit_history JSONB DEFAULT '[]'::jsonb;

-- Create index for archived status queries
CREATE INDEX IF NOT EXISTS idx_letterheads_archived 
ON letterheads (is_archived, created_at DESC);

-- Archive storage table for storing archive metadata separately
CREATE TABLE IF NOT EXISTS letterhead_archives (
  id                  BIGSERIAL       PRIMARY KEY,
  letterhead_id       BIGINT          NOT NULL REFERENCES letterheads(id),
  archive_reference   VARCHAR(100)    NOT NULL UNIQUE,
  storage_location    VARCHAR(1000)   NOT NULL,
  archived_by         BIGINT          NOT NULL REFERENCES users(id),
  archived_at         TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  retention_until     DATE,
  metadata            JSONB           DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_archives_letterhead 
ON letterhead_archives (letterhead_id);

CREATE INDEX IF NOT EXISTS idx_archives_reference 
ON letterhead_archives (archive_reference);
