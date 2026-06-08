-- ============================================================
-- 1. Colonne avatar_url dans profils
-- ============================================================
alter table profils
  add column if not exists avatar_url text;

-- ============================================================
-- 2. Bucket Storage public "avatars"
--    Limite : 2 Mo, formats image uniquement
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- ============================================================
-- 3. RLS Storage — chaque utilisateur gère son propre dossier
--    Chemin : avatars/{user_id}/profile.{ext}
-- ============================================================
create policy "Avatars lisibles publiquement"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Upload avatar — utilisateur authentifié"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Mise à jour avatar — propriétaire"
  on storage.objects for update
  using (
    bucket_id = 'avatars' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Suppression avatar — propriétaire"
  on storage.objects for delete
  using (
    bucket_id = 'avatars' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

notify pgrst, 'reload schema';
