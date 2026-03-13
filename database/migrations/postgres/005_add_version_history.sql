-- Version history table for letterhead modifications
CREATE TABLE IF NOT EXISTS letterhead_versions (
  id                  BIGSERIAL       PRIMARY KEY,
  letterhead_id       BIGINT          NOT NULL REFERENCES letterheads(id) ON DELETE CASCADE,
  version_number      INTEGER         NOT NULL,
  description         VARCHAR(500)    NOT NULL,
  notes               VARCHAR(2000),
  modified_by         BIGINT          NOT NULL REFERENCES users(id),
  modified_at         TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  change_summary      VARCHAR(500)    -- Brief summary of what changed
);

-- Index for efficient version lookups
CREATE INDEX IF NOT EXISTS idx_letterhead_versions_letterhead 
ON letterhead_versions (letterhead_id, version_number DESC);

-- Add version tracking to letterheads
ALTER TABLE letterheads 
ADD COLUMN IF NOT EXISTS current_version INTEGER NOT NULL DEFAULT 1;

-- Trigger to automatically increment version on update
CREATE OR REPLACE FUNCTION increment_letterhead_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.current_version = OLD.current_version + 1;
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_increment_version ON letterheads;
CREATE TRIGGER trigger_increment_version
  BEFORE UPDATE ON letterheads
  FOR EACH ROW
  EXECUTE FUNCTION increment_letterhead_version();

-- Function to get version history for a letterhead
CREATE OR REPLACE FUNCTION get_letterhead_versions(p_letterhead_id BIGINT)
RETURNS TABLE (
  version_number INTEGER,
  description VARCHAR,
  notes VARCHAR,
  modified_by VARCHAR,
  modified_at TIMESTAMP,
  change_summary VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.version_number,
    v.description,
    v.notes,
    u.display_name as modified_by,
    v.modified_at,
    v.change_summary
  FROM letterhead_versions v
  JOIN users u ON v.modified_by = u.id
  WHERE v.letterhead_id = p_letterhead_id
  ORDER BY v.version_number DESC;
END;
$$ LANGUAGE plpgsql;
