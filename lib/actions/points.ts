'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { getLimits, getPlanLabel } from '@/lib/plan-limits'
import { uuidSchema, safeText, montantSchema, telephoneSchema } from '@/lib/validation'

const PointSchema = z.object({
  nom:       safeText(2, 100, 'Nom'),
  adresse:   safeText(0, 200, 'Adresse').optional().or(z.literal('')).optional(),
  telephone: telephoneSchema.optional().or(z.literal('')).optional(),
})

export type ActionState = { error?: string; success?: boolean }

export async function creerPoint(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const parsed = PointSchema.safeParse({
    nom:       formData.get('nom'),
    adresse:   formData.get('adresse') || undefined,
    telephone: formData.get('telephone') || undefined,
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  // Vérifier la limite du plan
  const { data: profil } = await supabase.from('profils').select('plan').eq('id', user.id).single()
  const plan = (profil as { plan: string | null } | null)?.plan
  const limits = getLimits(plan)
  if (limits.maxPoints < 999) {
    const { count } = await supabase
      .from('points_de_vente')
      .select('*', { count: 'exact', head: true })
      .eq('proprietaire_id', user.id)
    if ((count ?? 0) >= limits.maxPoints) {
      return {
        error: `Plan ${getPlanLabel(plan)} : maximum ${limits.maxPoints} point(s) de vente. Passez au plan supérieur dans Paramètres → Abonnement.`,
      }
    }
  }

  const { data: point, error } = await supabase
    .from('points_de_vente')
    .insert({ ...parsed.data, proprietaire_id: user.id })
    .select('id')
    .single()

  if (error) return { error: error.message }

  // Créer les entrées UV pour tous les réseaux
  const { data: reseaux } = await supabase.from('reseaux').select('id')
  if (reseaux && reseaux.length > 0) {
    await supabase.from('uv').insert(
      reseaux.map(r => ({
        point_de_vente_id: point.id,
        reseau_id: r.id,
        montant: 0,
        seuil_alerte: 50000,
      }))
    )
  }

  revalidatePath('/dashboard/points')
  revalidatePath('/dashboard')
  redirect(`/dashboard/points/${point.id}`)
}

export async function modifierPoint(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const idResult = uuidSchema.safeParse(formData.get('id'))
  if (!idResult.success) return { error: 'Identifiant de point invalide' }
  const id = idResult.data

  const parsed = PointSchema.safeParse({
    nom:       formData.get('nom'),
    adresse:   formData.get('adresse') || undefined,
    telephone: formData.get('telephone') || undefined,
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { error } = await supabase
    .from('points_de_vente')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('proprietaire_id', user.id) // ownership check

  if (error) return { error: error.message }

  revalidatePath('/dashboard/points')
  revalidatePath(`/dashboard/points/${id}`)
  return { success: true }
}

export async function supprimerPoint(id: string): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const idResult = uuidSchema.safeParse(id)
  if (!idResult.success) return { error: 'Identifiant invalide' }

  const { error } = await supabase
    .from('points_de_vente')
    .delete()
    .eq('id', idResult.data)
    .eq('proprietaire_id', user.id) // ownership check

  if (error) return { error: error.message }

  revalidatePath('/dashboard/points')
  revalidatePath('/dashboard')
  redirect('/dashboard/points')
}

export async function ajusterCaisseInitiale(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const pointIdResult = uuidSchema.safeParse(formData.get('point_id'))
  if (!pointIdResult.success) return { error: 'Identifiant de point invalide' }

  const montantResult = montantSchema.or(z.literal(0)).safeParse(formData.get('caisse_initiale'))
  if (!montantResult.success) return { error: 'Montant invalide' }

  const { error } = await supabase
    .from('points_de_vente')
    .update({ caisse_initiale: montantResult.data })
    .eq('id', pointIdResult.data)
    .eq('proprietaire_id', user.id) // ownership check

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/points/${pointIdResult.data}`)
  revalidatePath('/dashboard')
  return { success: true }
}

export async function mettreAJourUV(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const uvIdResult     = uuidSchema.safeParse(formData.get('uv_id'))
  const pointIdResult  = uuidSchema.safeParse(formData.get('point_de_vente_id'))
  if (!uvIdResult.success || !pointIdResult.success) return { error: 'Identifiants invalides' }

  const montantResult = montantSchema.or(z.literal(0)).safeParse(formData.get('montant'))
  if (!montantResult.success) return { error: 'Montant invalide' }

  const seuilResult = montantSchema.or(z.literal(0)).safeParse(formData.get('seuil_alerte'))
  if (!seuilResult.success) return { error: 'Seuil invalide' }

  // Vérifier accès : propriétaire OU agent avec peut_modifier_uv = true
  const { data: pointOwner } = await supabase
    .from('points_de_vente')
    .select('id')
    .eq('id', pointIdResult.data)
    .eq('proprietaire_id', user.id)
    .single()

  if (!pointOwner) {
    const { data: agentUv } = await supabase
      .from('agents')
      .select('id')
      .eq('user_id', user.id)
      .eq('point_de_vente_id', pointIdResult.data)
      .eq('peut_modifier_uv', true)
      .eq('actif', true)
      .single()
    if (!agentUv) return { error: 'Accès non autorisé' }
  }

  const { data: current } = await supabase
    .from('uv')
    .select('montant_max')
    .eq('id', uvIdResult.data)
    .eq('point_de_vente_id', pointIdResult.data) // Assure que l'UV appartient bien à ce point
    .single()

  if (!current) return { error: 'UV introuvable' }

  const currentMax = (current as { montant_max: number } | null)?.montant_max ?? 0
  const nouveauMax = Math.max(currentMax, montantResult.data)

  const { error } = await supabase
    .from('uv')
    .update({
      montant: montantResult.data,
      montant_max: nouveauMax,
      seuil_alerte: seuilResult.data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', uvIdResult.data)

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/points/${pointIdResult.data}`)
  revalidatePath('/dashboard')
  return { success: true }
}

export async function rechargerUV(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const uvIdResult    = uuidSchema.safeParse(formData.get('uv_id'))
  const pointIdResult = uuidSchema.safeParse(formData.get('point_de_vente_id'))
  if (!uvIdResult.success || !pointIdResult.success) return { error: 'Identifiants invalides' }

  const montantResult = montantSchema.safeParse(formData.get('montant_recharge'))
  if (!montantResult.success) return { error: 'Montant invalide (doit être un entier positif)' }

  // Accès : propriétaire OU agent avec peut_recharger_uv = true
  const { data: pointOwner } = await supabase
    .from('points_de_vente')
    .select('id')
    .eq('id', pointIdResult.data)
    .eq('proprietaire_id', user.id)
    .single()

  if (!pointOwner) {
    const { data: agentRecharge } = await supabase
      .from('agents')
      .select('id')
      .eq('user_id', user.id)
      .eq('point_de_vente_id', pointIdResult.data)
      .eq('peut_recharger_uv', true)
      .eq('actif', true)
      .single()
    if (!agentRecharge) return { error: 'Accès non autorisé' }
  }

  const { data: current } = await supabase
    .from('uv')
    .select('montant, montant_max')
    .eq('id', uvIdResult.data)
    .eq('point_de_vente_id', pointIdResult.data)
    .single()

  if (!current) return { error: 'UV introuvable' }

  const c = current as { montant: number; montant_max: number }
  const nouveauMontant = c.montant + montantResult.data
  const nouveauMax = Math.max(c.montant_max ?? 0, nouveauMontant)

  const { error } = await supabase
    .from('uv')
    .update({
      montant:     nouveauMontant,
      montant_max: nouveauMax,
      updated_at:  new Date().toISOString(),
    })
    .eq('id', uvIdResult.data)

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/points/${pointIdResult.data}`)
  revalidatePath('/dashboard')
  return { success: true }
}
