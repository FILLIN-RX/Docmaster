-- Migration 54: Add department and arrondissement fields for administrative divisions
-- Based on cameroon_administrative_divisions.json

-- declarations: add department and arrondissement
ALTER TABLE declarations ADD COLUMN IF NOT EXISTS department VARCHAR(100);
ALTER TABLE declarations ADD COLUMN IF NOT EXISTS arrondissement VARCHAR(100);

-- autorites: add department and arrondissement
ALTER TABLE autorites ADD COLUMN IF NOT EXISTS department VARCHAR(100);
ALTER TABLE autorites ADD COLUMN IF NOT EXISTS arrondissement VARCHAR(100);
