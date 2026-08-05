CREATE TABLE IF NOT EXISTS autorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telephone VARCHAR(20),
    mot_de_passe VARCHAR(255) NOT NULL,
    niveau VARCHAR(20) NOT NULL DEFAULT 'NORMAL' CHECK (niveau IN ('HAUTE', 'NORMAL')),
    ville VARCHAR(100) NOT NULL,
    region VARCHAR(100),
    is_active BOOLEAN DEFAULT false,
    must_change_password BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_autorites_email ON autorites(email);
CREATE INDEX idx_autorites_niveau ON autorites(niveau);
CREATE INDEX idx_autorites_ville ON autorites(ville);