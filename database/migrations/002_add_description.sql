-- Add description column to letterheads table
ALTER TABLE letterheads ADD COLUMN IF NOT EXISTS description VARCHAR(500);

-- Index for full-text search on description
CREATE INDEX IF NOT EXISTS idx_letterheads_description
  ON letterheads USING gin(to_tsvector('english', COALESCE(description, '')));
