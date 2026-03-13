-- Expand version history snapshots to store the full pre-update record

ALTER TABLE letterhead_versions
ADD COLUMN IF NOT EXISTS department_id BIGINT REFERENCES departments(id),
ADD COLUMN IF NOT EXISTS reference_number VARCHAR(30),
ADD COLUMN IF NOT EXISTS letter_date DATE,
ADD COLUMN IF NOT EXISTS approval_authority VARCHAR(200),
ADD COLUMN IF NOT EXISTS file_name VARCHAR(500),
ADD COLUMN IF NOT EXISTS file_path VARCHAR(1000),
ADD COLUMN IF NOT EXISTS file_size_bytes BIGINT,
ADD COLUMN IF NOT EXISTS mime_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS created_by BIGINT REFERENCES users(id),
ADD COLUMN IF NOT EXISTS original_created_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS original_updated_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS archive_reason VARCHAR(2000),
ADD COLUMN IF NOT EXISTS archived_file_path VARCHAR(1000);

UPDATE letterhead_versions v
SET
  department_id = COALESCE(v.department_id, l.department_id),
  reference_number = COALESCE(v.reference_number, l.reference_number),
  letter_date = COALESCE(v.letter_date, l.letter_date),
  approval_authority = COALESCE(v.approval_authority, l.approval_authority),
  file_name = COALESCE(v.file_name, l.file_name),
  file_path = COALESCE(v.file_path, l.file_path),
  file_size_bytes = COALESCE(v.file_size_bytes, l.file_size_bytes),
  mime_type = COALESCE(v.mime_type, l.mime_type),
  created_by = COALESCE(v.created_by, l.created_by),
  original_created_at = COALESCE(v.original_created_at, l.created_at),
  original_updated_at = COALESCE(v.original_updated_at, l.updated_at)
FROM letterheads l
WHERE v.letterhead_id = l.id;

CREATE INDEX IF NOT EXISTS idx_letterhead_versions_modified_at
ON letterhead_versions (letterhead_id, modified_at DESC);
