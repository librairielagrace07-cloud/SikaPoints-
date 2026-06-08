-- ══════════════════════════════════════════════════════════════════════════════
-- Migration : Solde de caisse physique
-- ══════════════════════════════════════════════════════════════════════════════

-- Ajoute un fond de caisse initial à chaque point de vente.
-- Le solde de caisse réel est calculé dynamiquement :
--   solde = caisse_initiale + Σ(DEPOT) - Σ(RETRAIT) - Σ(dépenses espèces)

ALTER TABLE points_de_vente
  ADD COLUMN IF NOT EXISTS caisse_initiale NUMERIC(15,0) NOT NULL DEFAULT 0
    CHECK (caisse_initiale >= 0);

NOTIFY pgrst, 'reload schema';
