'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { getLimits } from '@/lib/plan-limits'
import { uuidSchema, montantSchema, safeText } from '@/lib/validation'

const TransactionSchema = z.object({
  type:              z.enum(['RETRAIT', 'DEPOT']),
  montant:           montantSchema,
  reseau_id:         uuidSchema,
  point_de_vente_id: uuidSchema,
  agent_id:          uuidSchema.optional(),
  note:              safeText(0, 500, 'Note').optional().or(z.literal('')).optional(),
})

export type ActionState = { error?: string; success?: boolean }

export async function enregistrerTransaction(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const raw = {
    type:              formData.get('type') as string,
    montant:           Number(formData.get('montant')),
    reseau_id:         formData.get('reseau_id') as string,
    point_de_vente_id: formData.get('point_de_vente_id') as string,
    agent_id:          (formData.get('agent_id') as string) || undefined,
    note:              (formData.get('note') as string) || undefined,
  }

  const parsed = TransactionSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  // Vérifier que l'utilisateur a accès à ce point de vente
  const { data: pdv } = await supabase
    .from('points_de_vente')
    .select('proprietaire_id')
    .eq('id', parsed.data.point_de_vente_id)
    .single()

  if (!pdv) return { error: 'Point de vente introuvable' }

  const isProprietaire = (pdv as { proprietaire_id: string }).proprietaire_id === user.id
  if (!isProprietaire) {
    const { data: agentRow } = await supabase
      .from('agents')
      .select('id')
      .eq('user_id', user.id)
      .eq('point_de_vente_id', parsed.data.point_de_vente_id)
      .eq('actif', true)
      .single()
    if (!agentRow) return { error: 'Accès non autorisé à ce point de vente' }
  }

  // Vérifier la limite mensuelle du plan (Starter : 50/mois)
  const ownerId = (pdv as { proprietaire_id: string }).proprietaire_id
  const { data: profilPdv } = await supabase.from('profils').select('plan').eq('id', ownerId).single()
  const limits = getLimits((profilPdv as { plan: string | null } | null)?.plan)
  if (limits.maxTransactionsParMois > 0) {
    const now = new Date()
    const debutMois = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const { data: allPoints } = await supabase.from('points_de_vente').select('id').eq('proprietaire_id', ownerId)
    const allIds = (allPoints ?? []).map(p => (p as { id: string }).id)
    const { count } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .in('point_de_vente_id', allIds.length > 0 ? allIds : ['none'])
      .gte('created_at', debutMois)
    if ((count ?? 0) >= limits.maxTransactionsParMois) {
      return {
        error: `Limite de ${limits.maxTransactionsParMois} transactions par mois atteinte (plan Starter). Passez au plan supérieur dans Paramètres → Abonnement.`,
      }
    }
  }

  const { error } = await supabase.from('transactions').insert({
    ...parsed.data,
    agent_id: parsed.data.agent_id || null,
    note:     parsed.data.note     || null,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/transactions')
  revalidatePath('/dashboard')
  revalidatePath(`/dashboard/points/${parsed.data.point_de_vente_id}`)
  return { success: true }
}
