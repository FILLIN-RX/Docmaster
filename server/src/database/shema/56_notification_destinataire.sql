-- Notifications polymorphe : permet de cibler USER, PARTENAIRE ou AUTORITE.
-- Les partenaires et autorités ont leur propre compte (sans users.id lié),
-- donc user_id ne suffit plus comme cible.

ALTER TABLE notifications
    ADD COLUMN IF NOT EXISTS destinataire_type VARCHAR(20) NOT NULL DEFAULT 'USER';

ALTER TABLE notifications
    ADD COLUMN IF NOT EXISTS destinataire_id UUID;

-- Backfill : pour les anciennes notifs USER, destinataire_id = user_id
UPDATE notifications
SET destinataire_id = user_id
WHERE destinataire_id IS NULL AND user_id IS NOT NULL;

-- Index composite pour recherche efficace (dernières notifs d'un destinataire)
CREATE INDEX IF NOT EXISTS idx_notifications_destinataire
    ON notifications(destinataire_type, destinataire_id, created_at DESC);

-- Contrainte CHECK pour limiter les types valides
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'notifications_destinataire_type_check'
    ) THEN
        ALTER TABLE notifications
            ADD CONSTRAINT notifications_destinataire_type_check
            CHECK (destinataire_type IN ('USER', 'PARTENAIRE', 'AUTORITE'));
    END IF;
END $$;
