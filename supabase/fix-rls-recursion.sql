-- ============================================================
-- Correctif: récursion infinie dans les politiques RLS
-- Exécuter dans Supabase > SQL Editor
-- ============================================================

-- 1. Supprimer les anciennes policies qui créent la boucle
drop policy if exists "pdv_select" on points_de_vente;
drop policy if exists "agents_select" on agents;
drop policy if exists "agents_insert" on agents;
drop policy if exists "agents_update" on agents;
drop policy if exists "agents_delete" on agents;
drop policy if exists "uv_select" on uv;
drop policy if exists "uv_insert" on uv;
drop policy if exists "uv_update" on uv;
drop policy if exists "transactions_select" on transactions;
drop policy if exists "transactions_insert" on transactions;

-- 2. Fonctions SECURITY DEFINER (s'exécutent sans RLS → brise la boucle)
create or replace function est_proprietaire_du_point(point_id uuid)
returns boolean
language sql security definer set search_path = public stable
as $$
  select exists(
    select 1 from points_de_vente
    where id = point_id and proprietaire_id = auth.uid()
  );
$$;

create or replace function est_agent_du_point(point_id uuid)
returns boolean
language sql security definer set search_path = public stable
as $$
  select exists(
    select 1 from agents
    where point_de_vente_id = point_id
      and user_id = auth.uid()
      and actif = true
  );
$$;

create or replace function mes_points_ids()
returns setof uuid
language sql security definer set search_path = public stable
as $$
  select id from points_de_vente where proprietaire_id = auth.uid()
  union
  select point_de_vente_id from agents where user_id = auth.uid() and actif = true;
$$;

-- 3. Recréer les policies avec les fonctions (sans boucle)
create policy "pdv_select" on points_de_vente for select to authenticated
  using (
    proprietaire_id = auth.uid()
    or est_agent_du_point(id)
  );

create policy "agents_select" on agents for select to authenticated
  using (
    user_id = auth.uid()
    or est_proprietaire_du_point(point_de_vente_id)
  );

create policy "agents_insert" on agents for insert to authenticated
  with check (est_proprietaire_du_point(point_de_vente_id));

create policy "agents_update" on agents for update to authenticated
  using (est_proprietaire_du_point(point_de_vente_id));

create policy "agents_delete" on agents for delete to authenticated
  using (est_proprietaire_du_point(point_de_vente_id));

create policy "uv_select" on uv for select to authenticated
  using (point_de_vente_id in (select mes_points_ids()));

create policy "uv_insert" on uv for insert to authenticated
  with check (est_proprietaire_du_point(point_de_vente_id));

create policy "uv_update" on uv for update to authenticated
  using (est_proprietaire_du_point(point_de_vente_id));

create policy "transactions_select" on transactions for select to authenticated
  using (point_de_vente_id in (select mes_points_ids()));

create policy "transactions_insert" on transactions for insert to authenticated
  with check (point_de_vente_id in (select mes_points_ids()));
