-- Add IOM number column to letterheads table
ALTER TABLE letterheads ADD COLUMN iom_number VARCHAR(50) NULL;

-- Add IOM number column to letterhead_versions table for version tracking
ALTER TABLE letterhead_versions ADD COLUMN iom_number VARCHAR(50) NULL;

-- Create index for search
CREATE INDEX idx_letterheads_iom_number ON letterheads(iom_number);
