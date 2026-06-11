-- Nouvelle permission agent : peut recharger les UV (ajouter au solde)
ALTER TABLE agents ADD COLUMN IF NOT EXISTS peut_recharger_uv boolean NOT NULL DEFAULT false;
