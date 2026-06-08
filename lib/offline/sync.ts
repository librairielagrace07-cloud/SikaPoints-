import { createClient } from '@/lib/supabase/client'
import { getPendingTxs, markTxSynced, markTxError } from './db'

export async function syncPendingTransactions(): Promise<{ synced: number; errors: number }> {
  const pending = await getPendingTxs()
  if (pending.length === 0) return { synced: 0, errors: 0 }

  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { synced: 0, errors: pending.length }

  let synced = 0
  let errors = 0

  for (const tx of pending) {
    try {
      const { error } = await supabase.from('transactions').insert({
        point_de_vente_id: tx.point_de_vente_id,
        reseau_id:         tx.reseau_id,
        type:              tx.type,
        montant:           tx.montant,
        note:              tx.note,
        agent_id:          tx.agent_id,
        created_at:        tx.created_at,
      })
      if (error) throw new Error(error.message)
      await markTxSynced(tx.localId)
      synced++
    } catch (err) {
      await markTxError(tx.localId, String(err))
      errors++
    }
  }

  return { synced, errors }
}
