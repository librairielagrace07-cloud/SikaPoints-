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

CREATE INDEX IF NOT EXISTS idx_recharges_uv_point ON recharges_uv(point_de_vente_id);
CREATE INDEX IF NOT EXISTS idx_recharges_uv_uv    ON recharges_uv(uv_id);

-- RLS
ALTER TABLE recharges_uv ENABLE ROW LEVEL SECURITY;

-- INSERT : l'utilisateur ne peut insérer que ses propres recharges
CREATE POLICY "recharges_uv_insert" ON recharges_uv
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- SELECT : propriétaire du point OU agent actif assigné au point
CREATE POLICY "recharges_uv_select" ON recharges_uv
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM points_de_vente
      WHERE points_de_vente.id = recharges_uv.point_de_vente_id
        AND points_de_vente.proprietaire_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.user_id = auth.uid()
        AND agents.point_de_vente_id = recharges_uv.point_de_vente_id
        AND agents.actif = true
    )
  );
