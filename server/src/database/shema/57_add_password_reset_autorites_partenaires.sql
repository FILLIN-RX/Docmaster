-- Mot de passe oublié : tokens de réinitialisation pour autorites et partenaires

ALTER TABLE autorites ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255);
ALTER TABLE autorites ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP WITH TIME ZONE;

ALTER TABLE partenaires ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255);
ALTER TABLE partenaires ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_autorites_password_reset_token ON autorites(password_reset_token);
CREATE INDEX IF NOT EXISTS idx_partenaires_password_reset_token ON partenaires(password_reset_token);
