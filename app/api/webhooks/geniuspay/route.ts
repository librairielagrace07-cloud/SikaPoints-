import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corps invalide' }, { status: 400 })
  }

  // GeniusPay peut envoyer la payload à la racine ou dans body.data
  const payload = (body.data ?? body) as Record<string, unknown>

  const reference = (payload.reference ?? body.reference) as string | undefined
  const status    = (payload.status    ?? body.status)    as string | undefined
  const metadata  = (payload.metadata  ?? body.metadata)  as { user_id?: string; plan?: string; periode?: string } | undefined

  console.log('[GeniusPay webhook]', { reference, status, metadata })

  if (!reference) {
    return NextResponse.json({ error: 'Référence manquante' }, { status: 400 })
  }

  const admin = createAdminClient()

  const statut =
    status === 'success'   ? 'succes'    :
    status === 'failed'    ? 'echec'     :
    status === 'cancelled' ? 'annule'    : 'en_attente'

  // Mettre à jour le statut du paiement
  const { data: paiement } = await admin
    .from('paiements')
    .update({ statut, updated_at: new Date().toISOString() })
    .eq('reference_geniuspay', reference)
    .select('user_id, plan, periode')
    .single()

  // Si succès, mettre à jour le plan de l'utilisateur
  if (status === 'success' && (paiement?.user_id || metadata?.user_id)) {
    const userId = paiement?.user_id ?? metadata?.user_id
    const plan   = paiement?.plan   ?? metadata?.plan ?? 'starter'

    await admin
      .from('profils')
      .update({ plan, plan_debut: new Date().toISOString() })
      .eq('id', userId)
  }

  return NextResponse.json({ received: true })
}
