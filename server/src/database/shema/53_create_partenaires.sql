-- Module Partenaires : comptes organisation créés par l'admin uniquement.
-- Un partenaire = un user (role 'PARTNER') + profil organisation ici.
CREATE TABLE IF NOT EXISTS partenaires (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    nom_organisation VARCHAR(150) NOT NULL,
    adresse TEXT,
    logo_url TEXT,
    statut VARCHAR(20) NOT NULL DEFAULT 'ACTIF' CHECK (statut IN ('ACTIF', 'SUSPENDU', 'INACTIF')),
    must_change_password BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_partenaires_statut ON partenaires(statut);
CREATE INDEX IF NOT EXISTS idx_partenaires_created_at ON partenaires(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_partenaires_user_id ON partenaires(user_id);