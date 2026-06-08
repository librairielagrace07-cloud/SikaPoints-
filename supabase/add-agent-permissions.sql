-- ============================================================
-- Ajout des permissions par agent + login par téléphone
-- Exécuter dans Supabase > SQL Editor
-- ============================================================

-- 1. Ajouter les permissions à la table agents
alter table agents
  add column if not exists peut_deposer boolean not null default true,
  add column if not exists peut_retirer boolean not null default true,
  add column if not exists peut_voir_rapports boolean not null default false,
  add column if not exists peut_modifier_uv boolean not null default false,
  add column if not exists mot_de_passe_temp text; -- effacé après 1ère connexion

-- 2. Ajouter l'index sur le téléphone dans profils pour le login rapide
create index if not exists idx_profils_telephone on profils(telephone);

-- 3. Fonction pour retrouver l'email d'un utilisateur par son téléphone
-- (utilisée pour le login par téléphone)
create or replace function get_email_by_phone(phone_number text)
returns text
language sql security definer set search_path = public stable
as $$
  select email from auth.users
  where phone = phone_number
    or raw_user_meta_data->>'telephone' = phone_number
  limit 1;
$$;
