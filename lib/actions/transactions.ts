'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const TransactionSchema = z.object({
  type: z.enum(['RETRAIT', 'DEPOT']),
  montant: z.number().positive('Le montant doit être positif'),
  reseau_id: z.string().uuid(),
  point_de_vente_id: z.string().uuid(),
  agent_id: z.string().uuid().optional(),
  note: z.string().optional(),
})

export type ActionState = { error?: string; success?: boolean }

export async function enregistrerTransaction(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const raw = {
    type: formData.get('type') as string,
    montant: Number(formData.get('montant')),
    reseau_id: formData.get('reseau_id') as string,
    point_de_vente_id: formData.get('point_de_vente_id') as string,
    agent_id: (formData.get('agent_id') as string) || undefined,
    note: (formData.get('note') as string) || undefined,
  }

  const parsed = TransactionSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { error } = await supabase.from('transactions').insert({
    ...parsed.data,
    agent_id: parsed.data.agent_id || null,
    note: parsed.data.note || null,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/transactions')
  revalidatePath('/dashboard')
  revalidatePath(`/dashboard/points/${parsed.data.point_de_vente_id}`)
  return { success: true }
}
