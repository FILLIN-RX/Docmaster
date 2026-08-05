-- Module Partenaires autonome : comme autorites, plus aucun lien avec users.
-- Le partenaire possède son propre email, mot_de_passe, contacts, ville et wallet.

-- 1. Colonnes de compte autonome
ALTER TABLE partenaires
    ADD COLUMN IF NOT EXISTS email VARCHAR(255),
    ADD COLUMN IF NOT EXISTS mot_de_passe VARCHAR(255),
    ADD COLUMN IF NOT EXISTS telephone VARCHAR(20),
    ADD COLUMN IF NOT EXISTS nom_contact VARCHAR(100),
    ADD COLUMN IF NOT EXISTS prenom_contact VARCHAR(100),
    ADD COLUMN IF NOT EXISTS ville VARCHAR(100),
    ADD COLUMN IF NOT EXISTS region VARCHAR(100),
    ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS wallet_balance DECIMAL(15,2) DEFAULT 0;

-- 2. Backfill depuis les users existants
UPDATE partenaires p
SET email = u.email,
    mot_de_passe = u.mot_de_passe,
    telephone = u.telephone,
    nom_contact = u.nom,
    prenom_contact = u.prenom,
    ville = u.ville,
    is_verified = u.is_verified,
    wallet_balance = COALESCE(u.wallet_balance, 0)
FROM users u
WHERE p.user_id = u.id;

-- 3. Table des transactions du wallet partenaire
CREATE TABLE IF NOT EXISTS partenaire_wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partenaire_id UUID REFERENCES partenaires(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL,
    balance_before DECIMAL(15, 2) NOT NULL DEFAULT 0,
    balance_after DECIMAL(15, 2) NOT NULL DEFAULT 0,
    type VARCHAR(20) NOT NULL CHECK (type IN ('CREDIT', 'DEBIT')),
    reason VARCHAR(50) NOT NULL,
    reference_id UUID,
    reference_type VARCHAR(50),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pwt_partenaire_id ON partenaire_wallet_transactions(partenaire_id);
CREATE INDEX IF NOT EXISTS idx_pwt_created_at ON partenaire_wallet_transactions(created_at DESC);

-- 4. Migrer les transactions wallet existantes des partenaires
INSERT INTO partenaire_wallet_transactions
    (id, partenaire_id, amount, balance_before, balance_after, type, reason, reference_id, reference_type, metadata, created_at)
SELECT w.id, p.id, w.amount, w.balance_before, w.balance_after, w.type, w.reason, w.reference_id, w.reference_type, w.metadata, w.created_at
FROM wallet_transactions w
JOIN partenaires p ON p.user_id = w.user_id;

-- 5. reporter_type sur declarations (USER par défaut) + retrait FK reporter_id (peut être un partenaire)
ALTER TABLE declarations ADD COLUMN IF NOT EXISTS reporter_type VARCHAR(20) NOT NULL DEFAULT 'USER';
ALTER TABLE declarations DROP CONSTRAINT IF EXISTS declarations_reporter_id_fkey;

-- 6. Réaffecter les anciennes déclarations des partenaires à leur id propre
UPDATE declarations d
SET reporter_id = p.id, reporter_type = 'PARTENAIRE'
FROM partenaires p
WHERE d.reporter_id = p.user_id;

-- 7. Réaffecter les claims dont le finder était le user du partenaire
UPDATE claims c
SET finder_id = p.id
FROM partenaires p
WHERE c.finder_id = p.user_id;

-- 8. Retrait FK finder_id sur claims (peut être un partenaire)
ALTER TABLE claims DROP CONSTRAINT IF EXISTS claims_finder_id_fkey;

-- 9. Retirer le lien user_id des partenaires (FK + colonne)
ALTER TABLE partenaires DROP CONSTRAINT IF EXISTS partenaires_user_id_fkey;
DROP INDEX IF EXISTS idx_partenaires_user_id;
ALTER TABLE partenaires DROP COLUMN IF EXISTS user_id;

-- 10. created_by devient informatif (comme autorites) : id admin ou autre, sans contrainte
ALTER TABLE partenaires DROP CONSTRAINT IF EXISTS partenaires_created_by_fkey;

-- 11. Email unique pour la connexion
CREATE UNIQUE INDEX IF NOT EXISTS idx_partenaires_email ON partenaires(LOWER(email));
