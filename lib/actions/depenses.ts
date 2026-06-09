'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { uuidSchema, safeText, montantSchema } from '@/lib/validation'

const DepenseSchema = z.object({
  date_depense:         z.string().min(1, 'Date requise').max(20),
  libelle:              safeText(1, 200, 'Libellé'),
  montant:              montantSchema,
  compte_code:          z.string().min(1, 'Compte requis').max(20).regex(/^[\w\-]+$/, 'Code compte invalide'),
  compte_libelle:       safeText(1, 100, 'Compte libellé'),
  compte_contrepartie:  z.string().min(1, 'Contrepartie requise').max(20).regex(/^[\w\-]+$/, 'Code contrepartie invalide'),
  libelle_contrepartie: safeText(1, 100, 'Libellé contrepartie'),
  point_de_vente_id:    uuidSchema.optional().nullable(),
  mode_paiement:        z.enum(['ESPECES', 'VIREMENT', 'CHEQUE', 'MOBILE_MONEY']),
  note:                 safeText(0, 500, 'Note').optional().nullable(),
})

const TauxSchema = z.object({
  taux: z.number().min(0).max(100),
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

  // Si un point est fourni, vérifier qu'il appartient bien à l'utilisateur
  if (point_de_vente_id) {
    const { data: pdv } = await supabase
      .from('points_de_vente')
      .select('id')
      .eq('id', point_de_vente_id)
      .eq('proprietaire_id', user.id)
      .single()
    if (!pdv) return { error: 'Point de vente non autorisé' }
  }

  const { error } = await supabase.from('depenses').insert({
    ...rest,
    point_de_vente_id: point_de_vente_id || null,
    note:              note || null,
    proprietaire_id:   user.id,
  })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/comptabilite')
  return { success: 'Dépense enregistrée' }
}

export async function modifierDepense(id: string, prevState: State, formData: FormData): Promise<State> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const idResult = uuidSchema.safeParse(id)
  if (!idResult.success) return { error: 'Identifiant invalide' }

  const raw = Object.fromEntries(formData)
  const parsed = DepenseSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Données invalides' }

  const { point_de_vente_id, note, ...rest } = parsed.data

  const { error } = await supabase
    .from('depenses')
    .update({ ...rest, point_de_vente_id: point_de_vente_id || null, note: note || null })
    .eq('id', idResult.data)
    .eq('proprietaire_id', user.id) // ownership check

  if (error) return { error: error.message }
  revalidatePath('/dashboard/comptabilite')
  return { success: 'Dépense modifiée' }
}

export async function supprimerDepense(id: string): Promise<State> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const idResult = uuidSchema.safeParse(id)
  if (!idResult.success) return { error: 'Identifiant invalide' }

  const { error } = await supabase
    .from('depenses')
    .delete()
    .eq('id', idResult.data)
    .eq('proprietaire_id', user.id) // ownership check

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
    // Clé strictement de la forme depot_<uuid> ou retrait_<uuid>
    const m = key.match(/^(depot|retrait)_([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i)
    if (!m) return

    const [, type, reseauId] = m

    // Valider le taux
    const tauxPct = parseFloat(String(value))
    const tauxResult = TauxSchema.safeParse({ taux: tauxPct })
    if (!tauxResult.success) return // ignorer les valeurs hors-bornes

    const val = tauxPct / 100

    let entry = entries.find(e => e.reseau_id === reseauId)
    if (!entry) {
      entry = { reseau_id: reseauId, taux_depot: 0, taux_retrait: 0 }
      entries.push(entry)
    }
    if (type === 'depot')   entry.taux_depot   = val
    if (type === 'retrait') entry.taux_retrait  = val
  })

  if (entries.length === 0) return { error: 'Aucun taux valide fourni' }

  const rows = entries.map(e => ({ ...e, proprietaire_id: user.id }))

  const { error } = await supabase
    .from('taux_commission')
    .upsert(rows, { onConflict: 'reseau_id,proprietaire_id' })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/comptabilite')
  return { success: 'Taux enregistrés' }
}
