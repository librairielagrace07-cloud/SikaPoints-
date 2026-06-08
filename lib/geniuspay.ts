const BASE_URL = 'https://geniuspay.ci/api/v1/merchant'

function headers() {
  return {
    'Content-Type': 'application/json',
    'X-API-Key': process.env.GENIUSPAY_API_KEY!,
    'X-API-Secret': process.env.GENIUSPAY_API_SECRET!,
  }
}

export interface CreerPaiementParams {
  montant: number          // en FCFA
  plan: string             // 'solo' | 'croissance' | 'business'
  periode: string          // 'mensuel' | 'annuel'
  user_id: string
  customer_name: string
  customer_phone: string | null
  customer_email: string
}

export interface PaiementGeniusPay {
  reference: string
  checkout_url: string
  status: string
}

export async function creerPaiement(p: CreerPaiementParams): Promise<PaiementGeniusPay> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const body = {
    amount: p.montant,
    currency: 'XOF',
    customer_name: p.customer_name,
    customer_phone: p.customer_phone ?? undefined,
    customer_email: p.customer_email,
    description: `Abonnement SikaPoints — Plan ${p.plan} (${p.periode})`,
    return_url: `${appUrl}/paiement/succes?plan=${p.plan}`,
    cancel_url: `${appUrl}/paiement/echec?plan=${p.plan}`,
    callback_url: `${appUrl}/api/webhooks/geniuspay`,
    metadata: {
      user_id: p.user_id,
      plan: p.plan,
      periode: p.periode,
    },
  }

  const res = await fetch(`${BASE_URL}/payments`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  })

  const raw = await res.json().catch(() => ({}))
  console.log('[GeniusPay] POST /payments →', res.status, JSON.stringify(raw))

  if (!res.ok) {
    throw new Error(`GeniusPay ${res.status}: ${raw?.message ?? raw?.error ?? JSON.stringify(raw)}`)
  }

  // GeniusPay enveloppe la réponse dans un objet "data"
  const payload = (raw.data ?? raw) as Record<string, unknown>

  const checkout_url = (
    payload.checkout_url ?? payload.payment_url ?? payload.redirect_url ?? payload.url ?? payload.link
  ) as string | undefined

  if (!checkout_url) {
    throw new Error(`GeniusPay: URL de paiement absente. Réponse: ${JSON.stringify(raw)}`)
  }

  return {
    reference:    (payload.reference ?? raw.reference ?? '') as string,
    checkout_url,
    status:       (payload.status ?? raw.status ?? '') as string,
  } as PaiementGeniusPay
}

export async function getPaiement(reference: string): Promise<PaiementGeniusPay & { metadata?: Record<string, string> }> {
  const res = await fetch(`${BASE_URL}/payments/${reference}`, {
    headers: headers(),
    cache: 'no-store',
  })
  const raw = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`GeniusPay error ${res.status}`)
  const payload = (raw.data ?? raw) as Record<string, unknown>
  return {
    reference:    (payload.reference ?? '') as string,
    checkout_url: (payload.checkout_url ?? '') as string,
    status:       (payload.status ?? '') as string,
    metadata:     payload.metadata as Record<string, string> | undefined,
  }
}
