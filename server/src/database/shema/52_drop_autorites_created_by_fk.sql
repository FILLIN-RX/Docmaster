-- created_by peut être un id de user (admin) OU d'autorité (HAUTE) : contrainte FK retirée, champ informatif
ALTER TABLE autorites DROP CONSTRAINT IF EXISTS autorites_created_by_fkey;