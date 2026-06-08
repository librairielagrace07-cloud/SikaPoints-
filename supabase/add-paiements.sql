-- Table des paiements GeniusPay
CREATE TABLE IF NOT EXISTS paiements (
  id                  UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             UUID        NOT NULL REFERENCES profils(id) ON DELETE CASCADE,
  plan                TEXT        NOT NULL CHECK (plan IN ('solo', 'croissance', 'business')),
  montant             INTEGER     NOT NULL,
  periode             TEXT        NOT NULL CHECK (periode IN ('mensuel', 'annuel')),
  reference_geniuspay TEXT        UNIQUE,
  statut              TEXT        NOT NULL DEFAULT 'en_attente'
                                  CHECK (statut IN ('en_attente', 'succes', 'echec', 'annule')),
  metadata            JSONB       NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour les lookups fréquents
CREATE INDEX IF NOT EXISTS paiements_user_id_idx        ON paiements(user_id);
CREATE INDEX IF NOT EXISTS paiements_reference_idx      ON paiements(reference_geniuspay);
CREATE INDEX IF NOT EXISTS paiements_statut_idx         ON paiements(statut);

-- RLS : chaque utilisateur voit uniquement ses paiements
ALTER TABLE paiements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own paiements"
  ON paiements FOR SELECT
  USING (auth.uid() = user_id);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS paiements_updated_at ON paiements;
CREATE TRIGGER paiements_updated_at
  BEFORE UPDATE ON paiements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
