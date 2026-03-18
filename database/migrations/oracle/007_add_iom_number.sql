-- Add IOM number column to letterheads table
ALTER TABLE letterheads ADD iom_number VARCHAR2(50) NULL;

-- Add IOM number column to letterhead_versions table for version tracking
ALTER TABLE letterhead_versions ADD iom_number VARCHAR2(50) NULL;

-- Create index for search
CREATE INDEX idx_letterheads_iom_number ON letterheads(iom_number);
