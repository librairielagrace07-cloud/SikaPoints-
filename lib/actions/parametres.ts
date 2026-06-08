'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

export type ActionState = { error?: string; success?: string }

// ─── Modifier le profil (nom complet) ────────────────────────────────────────

const ProfilSchema = z.object({
  nom_complet: z.string().min(2, 'Nom requis (min 2 caractères)'),
})

export async function modifierProfil(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const parsed = ProfilSchema.safeParse({ nom_complet: formData.get('nom_complet') })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { error } = await supabase
    .from('profils')
    .update({ nom_complet: parsed.data.nom_complet, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  if (error) return { error: error.message }

  // Sync metadata auth
  await supabase.auth.updateUser({ data: { nom_complet: parsed.data.nom_complet } })

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/parametres')
  return { success: 'Profil mis à jour' }
}

// ─── Changer le mot de passe ──────────────────────────────────────────────────

const MdpSchema = z.object({
  mdp_actuel: z.string().min(1, 'Mot de passe actuel requis'),
  nouveau_mdp: z.string().min(6, 'Nouveau mot de passe : au moins 6 caractères'),
  confirmer_mdp: z.string(),
}).refine(d => d.nouveau_mdp === d.confirmer_mdp, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmer_mdp'],
})

export async function changerMotDePasse(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const parsed = MdpSchema.safeParse({
    mdp_actuel: formData.get('mdp_actuel'),
    nouveau_mdp: formData.get('nouveau_mdp'),
    confirmer_mdp: formData.get('confirmer_mdp'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  // Vérifier le mot de passe actuel en essayant de se connecter
  const email = user.email!
  const { error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.mdp_actuel,
  })
  if (loginError) return { error: 'Mot de passe actuel incorrect' }

  // Mettre à jour
  const { error } = await supabase.auth.updateUser({ password: parsed.data.nouveau_mdp })
  if (error) return { error: error.message }

  return { success: 'Mot de passe mis à jour' }
}

// ─── Seuil UV par défaut (propriétaire) ───────────────────────────────────────

const SeuilSchema = z.object({
  seuil_defaut: z.number().min(0, 'Le seuil doit être positif ou nul'),
})

export async function definirSeuilDefaut(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const parsed = SeuilSchema.safeParse({ seuil_defaut: Number(formData.get('seuil_defaut')) })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  // Stocker dans les user_metadata (pas de colonne dédiée, évite une migration)
  const { error } = await supabase.auth.updateUser({
    data: { seuil_uv_defaut: parsed.data.seuil_defaut },
  })
  if (error) return { error: error.message }

  // Appliquer à tous les UV existants de ce propriétaire
  if (formData.get('appliquer_existants') === 'on') {
    const { data: points } = await supabase
      .from('points_de_vente')
      .select('id')
      .eq('proprietaire_id', user.id)
    if (points && points.length > 0) {
      const ids = points.map(p => p.id)
      await supabase
        .from('uv')
        .update({ seuil_alerte: parsed.data.seuil_defaut })
        .in('point_de_vente_id', ids)
    }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/parametres')
  return { success: 'Seuil par défaut enregistré' }
}

// ─── Avatar : upload + suppression (admin client → bypass RLS Storage) ────────

export async function uploadAvatar(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState & { url?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const file = formData.get('avatar') as File | null
  if (!file || file.size === 0) return { error: 'Aucun fichier reçu' }

  const admin = createAdminClient()

  // Créer le bucket si absent (idempotent)
  await admin.storage.createBucket('avatars', {
    public: true,
    fileSizeLimit: 2097152,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  })

  const bytes = await file.arrayBuffer()
  const path = `${user.id}/profile.jpg`

  const { error: uploadError } = await admin.storage
    .from('avatars')
    .upload(path, Buffer.from(bytes), { upsert: true, contentType: 'image/jpeg' })

  if (uploadError) return { error: uploadError.message }

  const { data: { publicUrl } } = admin.storage.from('avatars').getPublicUrl(path)
  const url = `${publicUrl}?t=${Date.now()}`

  const { error: dbError } = await supabase
    .from('profils')
    .update({ avatar_url: url, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  if (dbError) return { error: dbError.message }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/parametres')
  return { success: 'Photo mise à jour', url }
}

export async function supprimerAvatar(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const admin = createAdminClient()
  await admin.storage.from('avatars').remove([`${user.id}/profile.jpg`])

  const { error } = await supabase
    .from('profils')
    .update({ avatar_url: null, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/parametres')
  return { success: 'Photo supprimée' }
}

// ─── Supprimer le compte propriétaire ────────────────────────────────────────

export async function supprimerCompte(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const confirmation = formData.get('confirmation') as string
  if (confirmation !== 'SUPPRIMER') return { error: 'Tapez "SUPPRIMER" pour confirmer' }

  const adminClient = createAdminClient()
  const { error } = await adminClient.auth.admin.deleteUser(user.id)
  if (error) return { error: error.message }

  return { success: 'Compte supprimé' }
}
