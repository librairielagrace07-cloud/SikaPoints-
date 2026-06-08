-- ============================================================
-- 1. Ajouter montant_max à la table uv
--    Sert de référence pour la barre de progression (UV restant / UV max)
-- ============================================================
alter table uv
  add column if not exists montant_max numeric(15,0) default 0 not null;

-- Initialiser montant_max avec le montant actuel pour les enregistrements existants
update uv set montant_max = montant where montant_max = 0;

-- ============================================================
-- 2. Mettre à jour le trigger pour :
--    a) notifier quand montant <= seuil (pas seulement <)
--    b) maintenir montant_max quand UV augmente via DEPOT
-- ============================================================
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
  insert into uv (point_de_vente_id, reseau_id, montant, montant_max)
  values (new.point_de_vente_id, new.reseau_id, 0, 0)
  on conflict (point_de_vente_id, reseau_id) do nothing;

  -- Mettre à jour le montant selon le type
  if new.type = 'DEPOT' then
    -- DEPOT augmente l'UV — met aussi à jour montant_max si on dépasse le précédent max
    update uv
    set
      montant = montant + new.montant,
      montant_max = greatest(montant_max, montant + new.montant),
      updated_at = now()
    where point_de_vente_id = new.point_de_vente_id and reseau_id = new.reseau_id
    returning montant, seuil_alerte into new_montant, seuil;
  else
    -- RETRAIT diminue l'UV
    update uv
    set
      montant = greatest(0, montant - new.montant),
      updated_at = now()
    where point_de_vente_id = new.point_de_vente_id and reseau_id = new.reseau_id
    returning montant, seuil_alerte into new_montant, seuil;
  end if;

  -- Envoyer une notification si UV <= seuil (atteint OU en dessous)
  if new_montant <= seuil then
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

-- Recharger le schema PostgREST
notify pgrst, 'reload schema';
