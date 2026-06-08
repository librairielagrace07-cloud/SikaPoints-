'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const DepenseSchema = z.object({
  date_depense:        z.string().min(1, 'Date requise'),
  libelle:             z.string().min(1, 'Libellé requis').max(200),
  montant:             z.coerce.number().positive('Montant invalide'),
  compte_code:         z.string().min(1, 'Compte requis'),
  compte_libelle:      z.string().min(1),
  compte_contrepartie: z.string().min(1, 'Contrepartie requise'),
  libelle_contrepartie:z.string().min(1),
  point_de_vente_id:   z.string().optional().nullable(),
  mode_paiement:       z.enum(['ESPECES','VIREMENT','CHEQUE','MOBILE_MONEY']),
  note:                z.string().optional().nullable(),
})

type State = { error?: string; success?: string }

export async function ajouterDepense(prevState: State, formData: FormData): Promise<State> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const raw = Object.fromEntries(formData)
  const parsed = DepenseSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Données invalides' }

  const { point_de_vente_id, note, ...rest } = parsed.data

  const { error } = await supabase.from('depenses').insert({
    ...rest,
    point_de_vente_id: point_de_vente_id || null,
    note: note || null,
    proprietaire_id: user.id,
  })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/comptabilite')
  return { success: 'Dépense enregistrée' }
}

export async function modifierDepense(id: string, prevState: State, formData: FormData): Promise<State> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const raw = Object.fromEntries(formData)
  const parsed = DepenseSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Données invalides' }

  const { point_de_vente_id, note, ...rest } = parsed.data

  const { error } = await supabase
    .from('depenses')
    .update({ ...rest, point_de_vente_id: point_de_vente_id || null, note: note || null })
    .eq('id', id)
    .eq('proprietaire_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/comptabilite')
  return { success: 'Dépense modifiée' }
}

export async function supprimerDepense(id: string): Promise<State> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { error } = await supabase
    .from('depenses')
    .delete()
    .eq('id', id)
    .eq('proprietaire_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/comptabilite')
  return { success: 'Dépense supprimée' }
}

export async function sauvegarderTauxCommission(prevState: State, formData: FormData): Promise<State> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const entries: Array<{ reseau_id: string; taux_depot: number; taux_retrait: number }> = []

  formData.forEach((value, key) => {
    const m = key.match(/^(depot|retrait)_(.+)$/)
    if (!m) return
    const [, type, reseauId] = m
    let entry = entries.find(e => e.reseau_id === reseauId)
    if (!entry) {
      entry = { reseau_id: reseauId, taux_depot: 0, taux_retrait: 0 }
      entries.push(entry)
    }
    const val = parseFloat(String(value)) / 100  // convertir % → décimal
    if (type === 'depot')   entry.taux_depot   = isNaN(val) ? 0 : val
    if (type === 'retrait') entry.taux_retrait  = isNaN(val) ? 0 : val
  })

  const rows = entries.map(e => ({ ...e, proprietaire_id: user.id }))

  const { error } = await supabase
    .from('taux_commission')
    .upsert(rows, { onConflict: 'reseau_id,proprietaire_id' })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/comptabilite')
  return { success: 'Taux enregistrés' }
}
