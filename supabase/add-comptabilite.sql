-- ══════════════════════════════════════════════════════════════════════════════
-- Migration : Module Comptabilité SYSCOHADA
-- ══════════════════════════════════════════════════════════════════════════════

-- 1. Taux de commission par réseau et par propriétaire
CREATE TABLE IF NOT EXISTS taux_commission (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reseau_id      UUID NOT NULL REFERENCES reseaux(id) ON DELETE CASCADE,
  proprietaire_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  taux_depot     NUMERIC(7,5) NOT NULL DEFAULT 0 CHECK (taux_depot >= 0 AND taux_depot < 1),
  taux_retrait   NUMERIC(7,5) NOT NULL DEFAULT 0 CHECK (taux_retrait >= 0 AND taux_retrait < 1),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (reseau_id, proprietaire_id)
);

ALTER TABLE taux_commission ENABLE ROW LEVEL SECURITY;
CREATE POLICY "taux_commission_owner" ON taux_commission
  FOR ALL USING (proprietaire_id = auth.uid());

-- 2. Dépenses (charges d'exploitation)
CREATE TABLE IF NOT EXISTS depenses (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date_depense        DATE NOT NULL DEFAULT CURRENT_DATE,
  libelle             TEXT NOT NULL,
  montant             NUMERIC(15,0) NOT NULL CHECK (montant > 0),
  -- Compte de charge SYSCOHADA (classe 6)
  compte_code         VARCHAR(10) NOT NULL,
  compte_libelle      TEXT NOT NULL,
  -- Compte de contrepartie (trésorerie, classe 5)
  compte_contrepartie VARCHAR(10) NOT NULL DEFAULT '571',
  libelle_contrepartie TEXT NOT NULL DEFAULT 'Caisse',
  -- Infos complémentaires
  point_de_vente_id   UUID REFERENCES points_de_vente(id) ON DELETE SET NULL,
  mode_paiement       TEXT NOT NULL DEFAULT 'ESPECES'
                        CHECK (mode_paiement IN ('ESPECES','VIREMENT','CHEQUE','MOBILE_MONEY')),
  note                TEXT,
  proprietaire_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_depenses_prop_date
  ON depenses(proprietaire_id, date_depense DESC);
CREATE INDEX IF NOT EXISTS idx_depenses_point
  ON depenses(point_de_vente_id);

ALTER TABLE depenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "depenses_owner" ON depenses
  FOR ALL USING (proprietaire_id = auth.uid());

-- Rafraîchir le cache PostgREST
NOTIFY pgrst, 'reload schema';
