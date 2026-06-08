import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { creerPaiement } from '@/lib/geniuspay'

const PRIX: Record<string, Record<string, number>> = {
  solo:       { mensuel: 1900,  annuel: 1500  },
  croissance: { mensuel: 4900,  annuel: 3900  },
  business:   { mensuel: 12900, annuel: 9900  },
}

export async function POST(req: NextRequest) {
  // Vérifier que les clés GeniusPay sont configurées
  const apiKey = process.env.GENIUSPAY_API_KEY ?? ''
  if (!apiKey || apiKey.includes('VOTRE_CLE')) {
    return NextResponse.json(
      { error: 'Paiement non disponible : clés GeniusPay non configurées. Contactez l\'administrateur.' },
      { status: 503 }
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { plan, periode } = await req.json() as { plan: string; periode: string }

  if (!PRIX[plan] || !['mensuel', 'annuel'].includes(periode)) {
    return NextResponse.json({ error: 'Plan ou période invalide' }, { status: 400 })
  }

  const montant = PRIX[plan][periode]

  const { data: profil } = await supabase
    .from('profils')
    .select('nom_complet, telephone')
    .eq('id', user.id)
    .single()

  try {
    const paiement = await creerPaiement({
      montant, plan, periode,
      user_id: user.id,
      customer_name: profil?.nom_complet ?? 'Client',
      customer_phone: profil?.telephone ?? null,
      customer_email: user.email ?? '',
    })

    if (!paiement.checkout_url) {
      throw new Error('URL de paiement non reçue depuis GeniusPay')
    }

    // Enregistrer le paiement en attente (best-effort)
    const admin = createAdminClient()
    const { error: insertErr } = await admin.from('paiements').insert({
      user_id: user.id, plan, montant, periode,
      reference_geniuspay: paiement.reference,
      statut: 'en_attente',
    })
    if (insertErr) console.warn('[paiements] insert error:', insertErr.message)

    return NextResponse.json({ checkout_url: paiement.checkout_url })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue'
    console.error('[GeniusPay] initier paiement:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
