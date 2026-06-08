-- ============================================================
-- Super Admin + Plan d'abonnement
-- Exécuter dans: Supabase > SQL Editor
-- ============================================================

-- Ajouter le flag super admin
ALTER TABLE profils
  ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN NOT NULL DEFAULT false;

-- Ajouter le plan d'abonnement (avec valeur par défaut 'starter')
ALTER TABLE profils
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'starter'
    CHECK (plan IN ('starter', 'solo', 'croissance', 'business'));

-- Date de début de l'abonnement payant
ALTER TABLE profils
  ADD COLUMN IF NOT EXISTS plan_debut TIMESTAMPTZ;

-- ============================================================
-- Activer le super admin pour votre compte :
-- Remplacez l'email par le vôtre et exécutez cette ligne.
-- ============================================================
-- UPDATE profils
--   SET is_super_admin = true
--   WHERE id = (SELECT id FROM auth.users WHERE email = 'votre@email.com');
