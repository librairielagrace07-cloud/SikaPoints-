-- Ajoute la date d'expiration du plan à la table profils
ALTER TABLE profils ADD COLUMN IF NOT EXISTS plan_fin timestamptz;
