ALTER TABLE declarations ADD COLUMN IF NOT EXISTS is_certified BOOLEAN DEFAULT false;
ALTER TABLE declarations ADD COLUMN IF NOT EXISTS certified_by UUID REFERENCES autorites(id) ON DELETE SET NULL;
ALTER TABLE declarations ADD COLUMN IF NOT EXISTS certified_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_declarations_is_certified ON declarations(is_certified);
CREATE INDEX IF NOT EXISTS idx_declarations_certified_by ON declarations(certified_by);