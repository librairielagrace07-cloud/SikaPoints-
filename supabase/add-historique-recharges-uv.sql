-- Historique des recharges UV
CREATE TABLE IF NOT EXISTS recharges_uv (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  uv_id             uuid        NOT NULL REFERENCES uv(id) ON DELETE CASCADE,
  point_de_vente_id uuid        NOT NULL REFERENCES points_de_vente(id) ON DELETE CASCADE,
  user_id           uuid        NOT NULL REFERENCES auth.users(id),
  nom_utilisateur   text,
  montant_recharge  integer     NOT NULL,
  montant_avant     integer     NOT NULL,
  montant_apres     integer     NOT NULL,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- Index pour recherche rapide par point ou par UV
CREATE INDEX IF NOT EXISTS idx_recharges_uv_point ON recharges_uv(point_de_vente_id);
CREATE INDEX IF NOT EXISTS idx_recharges_uv_uv    ON recharges_uv(uv_id);
