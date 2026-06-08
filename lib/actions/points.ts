'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const PointSchema = z.object({
  nom: z.string().min(2, 'Nom requis'),
  adresse: z.string().optional(),
  telephone: z.string().optional(),
})

export type ActionState = { error?: string; success?: boolean }

export async function creerPoint(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const parsed = PointSchema.safeParse({
    nom: formData.get('nom'),
    adresse: formData.get('adresse'),
    telephone: formData.get('telephone'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

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
  const id = formData.get('id') as string

  const parsed = PointSchema.safeParse({
    nom: formData.get('nom'),
    adresse: formData.get('adresse'),
    telephone: formData.get('telephone'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { error } = await supabase
    .from('points_de_vente')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/points')
  revalidatePath(`/dashboard/points/${id}`)
  return { success: true }
}

export async function supprimerPoint(id: string): Promise<ActionState> {
  const supabase = await createClient()

  const { error } = await supabase.from('points_de_vente').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/dashboard/points')
  revalidatePath('/dashboard')
  redirect('/dashboard/points')
}

export async function ajusterCaisseInitiale(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const pointId = formData.get('point_id') as string
  const montant = Number(formData.get('caisse_initiale'))

  if (isNaN(montant) || montant < 0) return { error: 'Montant invalide' }

  const { error } = await supabase
    .from('points_de_vente')
    .update({ caisse_initiale: montant })
    .eq('id', pointId)
    .eq('proprietaire_id', user.id)

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/points/${pointId}`)
  revalidatePath('/dashboard')
  return { success: true }
}

export async function mettreAJourUV(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const uvId = formData.get('uv_id') as string
  const montant = Number(formData.get('montant'))
  const seuil = Number(formData.get('seuil_alerte'))
  const pointId = formData.get('point_de_vente_id') as string

  if (isNaN(montant) || montant < 0) return { error: 'Montant invalide' }

  // Lire le montant_max actuel pour ne pas le réduire si on saisit un montant inférieur
  const { data: current } = await supabase
    .from('uv')
    .select('montant_max')
    .eq('id', uvId)
    .single()

  const currentMax = (current as { montant_max: number } | null)?.montant_max ?? 0
  const nouveauMax = Math.max(currentMax, montant)

  const { error } = await supabase
    .from('uv')
    .update({
      montant,
      montant_max: nouveauMax,
      seuil_alerte: seuil,
      updated_at: new Date().toISOString(),
    })
    .eq('id', uvId)

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/points/${pointId}`)
  revalidatePath('/dashboard')
  return { success: true }
}
