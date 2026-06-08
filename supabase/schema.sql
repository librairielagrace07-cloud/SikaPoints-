-- ============================================================
-- Mobile Money Manager — Schéma SQL Supabase
-- Exécuter dans: Supabase > SQL Editor
-- ============================================================

-- Types ENUM
create type role as enum ('PROPRIETAIRE', 'AGENT');
create type type_transaction as enum ('RETRAIT', 'DEPOT');
create type type_notification as enum ('UV_FAIBLE', 'INFO', 'ALERTE');

-- ============================================================
-- Table: profils (extension de auth.users)
-- ============================================================
create table profils (
  id uuid references auth.users(id) on delete cascade primary key,
  nom_complet text not null,
  telephone text,
  role role not null default 'PROPRIETAIRE',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Trigger: créer le profil à l'inscription
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into profils (id, nom_complet, telephone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nom_complet', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'telephone',
    coalesce((new.raw_user_meta_data->>'role')::role, 'PROPRIETAIRE')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================================
-- Table: reseaux
-- ============================================================
create table reseaux (
  id uuid default gen_random_uuid() primary key,
  nom text not null unique,
  couleur text not null default '#6366f1',
  created_at timestamptz default now() not null
);

-- Données initiales
insert into reseaux (nom, couleur) values
  ('Wave', '#1B9AF5'),
  ('Orange Money', '#FF6600'),
  ('MTN MoMo', '#FFCC00'),
  ('Moov Money', '#00A651');

-- ============================================================
-- Table: points_de_vente
-- ============================================================
create table points_de_vente (
  id uuid default gen_random_uuid() primary key,
  nom text not null,
  adresse text,
  telephone text,
  proprietaire_id uuid references profils(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- ============================================================
-- Table: agents
-- ============================================================
create table agents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profils(id) on delete set null,
  nom_complet text not null,
  telephone text,
  email text,
  point_de_vente_id uuid references points_de_vente(id) on delete cascade not null,
  actif boolean default true not null,
  created_at timestamptz default now() not null
);

-- ============================================================
-- Table: uv (Unités de Valeur par réseau par point)
-- ============================================================
create table uv (
  id uuid default gen_random_uuid() primary key,
  point_de_vente_id uuid references points_de_vente(id) on delete cascade not null,
  reseau_id uuid references reseaux(id) on delete cascade not null,
  montant numeric(15,0) default 0 not null,
  seuil_alerte numeric(15,0) default 50000 not null,
  updated_at timestamptz default now() not null,
  unique(point_de_vente_id, reseau_id)
);

-- ============================================================
-- Table: transactions
-- ============================================================
create table transactions (
  id uuid default gen_random_uuid() primary key,
  type type_transaction not null,
  montant numeric(15,0) not null check (montant > 0),
  reseau_id uuid references reseaux(id) not null,
  point_de_vente_id uuid references points_de_vente(id) on delete cascade not null,
  agent_id uuid references agents(id) on delete set null,
  note text,
  created_at timestamptz default now() not null
);

-- Trigger: mettre à jour l'UV après chaque transaction
create or replace function update_uv_after_transaction()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  new_montant numeric;
  seuil numeric;
  pdv_nom text;
  reseau_nom text;
  proprietaire_id uuid;
begin
  -- Upsert UV
  insert into uv (point_de_vente_id, reseau_id, montant)
  values (new.point_de_vente_id, new.reseau_id, 0)
  on conflict (point_de_vente_id, reseau_id) do nothing;

  -- Mettre à jour le montant
  if new.type = 'DEPOT' then
    update uv set montant = montant + new.montant, updated_at = now()
    where point_de_vente_id = new.point_de_vente_id and reseau_id = new.reseau_id
    returning montant, seuil_alerte into new_montant, seuil;
  else
    update uv set montant = greatest(0, montant - new.montant), updated_at = now()
    where point_de_vente_id = new.point_de_vente_id and reseau_id = new.reseau_id
    returning montant, seuil_alerte into new_montant, seuil;
  end if;

  -- Envoyer une notification si UV < seuil
  if new_montant < seuil then
    select pdv.nom, r.nom, pdv.proprietaire_id
    into pdv_nom, reseau_nom, proprietaire_id
    from points_de_vente pdv
    join reseaux r on r.id = new.reseau_id
    where pdv.id = new.point_de_vente_id;

    insert into notifications (destinataire_id, expediteur_id, message, type, point_de_vente_id, reseau_id)
    values (
      proprietaire_id,
      new.agent_id,
      '⚠️ UV faible sur ' || reseau_nom || ' au point « ' || pdv_nom || ' » — Solde actuel: ' || new_montant || ' FCFA (seuil: ' || seuil || ' FCFA)',
      'UV_FAIBLE',
      new.point_de_vente_id,
      new.reseau_id
    );
  end if;

  return new;
end;
$$;

create trigger after_transaction_insert
  after insert on transactions
  for each row execute procedure update_uv_after_transaction();

-- ============================================================
-- Table: notifications
-- ============================================================
create table notifications (
  id uuid default gen_random_uuid() primary key,
  destinataire_id uuid references profils(id) on delete cascade not null,
  expediteur_id uuid references agents(id) on delete set null,
  message text not null,
  type type_notification default 'INFO' not null,
  lu boolean default false not null,
  point_de_vente_id uuid references points_de_vente(id) on delete cascade,
  reseau_id uuid references reseaux(id) on delete set null,
  created_at timestamptz default now() not null
);

-- ============================================================
-- Index pour les performances
-- ============================================================
create index idx_transactions_point_date on transactions(point_de_vente_id, created_at desc);
create index idx_transactions_reseau on transactions(reseau_id);
create index idx_notifications_destinataire on notifications(destinataire_id, lu, created_at desc);
create index idx_agents_point on agents(point_de_vente_id);
create index idx_uv_point on uv(point_de_vente_id);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================
alter table profils enable row level security;
alter table points_de_vente enable row level security;
alter table agents enable row level security;
alter table uv enable row level security;
alter table transactions enable row level security;
alter table notifications enable row level security;
alter table reseaux enable row level security;

-- Réseaux: lecture publique (authentifiés)
create policy "reseaux_select" on reseaux for select to authenticated using (true);

-- Profils: chacun voit le sien
create policy "profils_select_own" on profils for select to authenticated using (auth.uid() = id);
create policy "profils_update_own" on profils for update to authenticated using (auth.uid() = id);

-- Points de vente: propriétaire voit ses points, agents voient leur point
create policy "pdv_select" on points_de_vente for select to authenticated
  using (
    proprietaire_id = auth.uid()
    or id in (select point_de_vente_id from agents where user_id = auth.uid() and actif = true)
  );
create policy "pdv_insert" on points_de_vente for insert to authenticated
  with check (proprietaire_id = auth.uid());
create policy "pdv_update" on points_de_vente for update to authenticated
  using (proprietaire_id = auth.uid());
create policy "pdv_delete" on points_de_vente for delete to authenticated
  using (proprietaire_id = auth.uid());

-- Agents: propriétaire gère, agent voit ses collègues
create policy "agents_select" on agents for select to authenticated
  using (
    point_de_vente_id in (select id from points_de_vente where proprietaire_id = auth.uid())
    or user_id = auth.uid()
  );
create policy "agents_insert" on agents for insert to authenticated
  with check (
    point_de_vente_id in (select id from points_de_vente where proprietaire_id = auth.uid())
  );
create policy "agents_update" on agents for update to authenticated
  using (
    point_de_vente_id in (select id from points_de_vente where proprietaire_id = auth.uid())
  );
create policy "agents_delete" on agents for delete to authenticated
  using (
    point_de_vente_id in (select id from points_de_vente where proprietaire_id = auth.uid())
  );

-- UV: propriétaire et agents du point
create policy "uv_select" on uv for select to authenticated
  using (
    point_de_vente_id in (select id from points_de_vente where proprietaire_id = auth.uid())
    or point_de_vente_id in (select point_de_vente_id from agents where user_id = auth.uid() and actif = true)
  );
create policy "uv_insert" on uv for insert to authenticated
  with check (
    point_de_vente_id in (select id from points_de_vente where proprietaire_id = auth.uid())
  );
create policy "uv_update" on uv for update to authenticated
  using (
    point_de_vente_id in (select id from points_de_vente where proprietaire_id = auth.uid())
  );

-- Transactions: propriétaire et agents du point
create policy "transactions_select" on transactions for select to authenticated
  using (
    point_de_vente_id in (select id from points_de_vente where proprietaire_id = auth.uid())
    or point_de_vente_id in (select point_de_vente_id from agents where user_id = auth.uid() and actif = true)
  );
create policy "transactions_insert" on transactions for insert to authenticated
  with check (
    point_de_vente_id in (select id from points_de_vente where proprietaire_id = auth.uid())
    or point_de_vente_id in (select point_de_vente_id from agents where user_id = auth.uid() and actif = true)
  );

-- Notifications: chacun voit les siennes
create policy "notifs_select" on notifications for select to authenticated
  using (destinataire_id = auth.uid());
create policy "notifs_update" on notifications for update to authenticated
  using (destinataire_id = auth.uid());

-- Activer Realtime pour les notifications
alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table uv;
