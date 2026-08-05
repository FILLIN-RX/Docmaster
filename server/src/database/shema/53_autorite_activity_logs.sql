-- Autorité activity log : actions des autorités (certification, décertification,
-- création/suppression d'autorités, etc.) avec zone dénormalisée pour permettre
-- aux autorités HAUTES de voir l'activité de leur secteur.
CREATE TABLE IF NOT EXISTS autorite_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    autorite_id UUID REFERENCES autorites(id) ON DELETE SET NULL,
    autorite_nom VARCHAR(100),
    autorite_prenom VARCHAR(100),
    autorite_niveau VARCHAR(20),
    autorite_ville VARCHAR(100),
    autorite_region VARCHAR(100),
    action_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id VARCHAR(100),
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_autorite_logs_autorite_id ON autorite_activity_logs(autorite_id);
CREATE INDEX IF NOT EXISTS idx_autorite_logs_ville ON autorite_activity_logs(autorite_ville);
CREATE INDEX IF NOT EXISTS idx_autorite_logs_region ON autorite_activity_logs(autorite_region);
CREATE INDEX IF NOT EXISTS idx_autorite_logs_created_at ON autorite_activity_logs(created_at DESC);