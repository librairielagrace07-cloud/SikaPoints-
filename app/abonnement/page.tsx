'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState, Suspense } from 'react'
import { Check, Loader2, Shield, Smartphone } from 'lucide-react'
import Logo from '@/components/ui/logo'
import Link from 'next/link'

const PLANS: Record<string, {
  nom: string
  prix: { mensuel: number; annuel: number }
  features: string[]
  couleur: string
}> = {
  solo: {
    nom: 'Solo',
    prix: { mensuel: 1900, annuel: 1500 },
    features: ['1 point de vente', '3 agents', 'Historique illimité', 'Transactions illimitées', 'Mode hors ligne', 'Alertes UV', 'Rapports PDF & Excel'],
    couleur: 'blue',
  },
  croissance: {
    nom: 'Croissance',
    prix: { mensuel: 4900, annuel: 3900 },
    features: ['3 points de vente', '10 agents', 'Historique illimité', 'Transactions illimitées', 'Mode hors ligne', 'Alertes UV', 'Rapports PDF & Excel', 'Comptabilité SYSCOHADA', 'Comparaison des points'],
    couleur: 'green',
  },
  business: {
    nom: 'Business',
    prix: { mensuel: 12900, annuel: 9900 },
    features: ['Points de vente illimités', 'Agents illimités', 'Historique illimité', 'Mode hors ligne', 'Rapports PDF & Excel', 'Comptabilité SYSCOHADA', 'Support prioritaire 24/7'],
    couleur: 'purple',
  },
}

function fmt(n: number) {
  return n.toLocaleString('fr-FR') + ' FCFA'
}

function AbonnementContent() {
  const params = useSearchParams()
  const router = useRouter()
  const planId  = params.get('plan')   ?? 'croissance'
  const periode = (params.get('periode') ?? 'mensuel') as 'mensuel' | 'annuel'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const plan = PLANS[planId]
  if (!plan) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Plan introuvable.</p>
        <Link href="/#tarifs" className="mt-4 inline-block text-green-600 underline">Voir les tarifs</Link>
      </div>
    )
  }

  const montant = plan.prix[periode]
  const montantAnnuel = montant * (periode === 'annuel' ? 12 : 1)

  async function payer() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/paiement/initier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId, periode }),
      })

      if (res.status === 401) {
        router.push(`/login?next=/abonnement?plan=${planId}&periode=${periode}`)
        return
      }

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur inconnue')
      if (!data.checkout_url) throw new Error('URL de paiement manquante. Vérifiez la configuration GeniusPay.')

      window.location.href = data.checkout_url
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Une erreur est survenue')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo className="h-12 w-auto" />
        </div>

        {/* Carte récapitulatif */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-green-600 px-6 py-5 text-white">
            <p className="text-sm font-medium text-green-100 mb-1">Plan sélectionné</p>
            <h1 className="text-2xl font-bold">SikaPoints {plan.nom}</h1>
            <div className="mt-3">
              <span className="text-3xl font-extrabold">{fmt(montant)}</span>
              <span className="text-green-200 text-sm ml-2">/ {periode === 'mensuel' ? 'mois' : 'mois (facturé annuellement)'}</span>
            </div>
            {periode === 'annuel' && (
              <p className="text-xs text-green-200 mt-1">soit {fmt(montantAnnuel)} / an</p>
            )}
          </div>

          <div className="px-6 py-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Inclus dans ce plan :</h2>
            <ul className="space-y-2 mb-6">
              {plan.features.map(f => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-green-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            {/* Méthodes de paiement */}
            <div className="bg-gray-50 rounded-xl p-4 mb-5">
              <div className="flex items-center gap-2 mb-3">
                <Smartphone className="w-4 h-4 text-gray-500" />
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Paiement Mobile Money accepté</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { nom: 'Wave',         couleur: 'bg-blue-500'   },
                  { nom: 'Orange Money', couleur: 'bg-orange-500' },
                  { nom: 'MTN MoMo',    couleur: 'bg-yellow-400' },
                  { nom: 'Moov Money',  couleur: 'bg-blue-700'   },
                ].map(m => (
                  <span key={m.nom} className={`${m.couleur} text-white text-xs font-medium px-2.5 py-1 rounded-lg`}>
                    {m.nom}
                  </span>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
                {error}
              </p>
            )}

            <button
              onClick={payer}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3.5 rounded-xl transition-colors disabled:opacity-60"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Redirection en cours…</>
              ) : (
                <>Payer {fmt(montant)} par Mobile Money</>
              )}
            </button>

            <div className="flex items-center gap-1.5 justify-center mt-3 text-xs text-gray-400">
              <Shield className="w-3 h-3" />
              Paiement sécurisé via GeniusPay
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Vous serez redirigé vers la plateforme GeniusPay pour finaliser le paiement.
          <br />
          <Link href="/#tarifs" className="text-green-600 hover:underline">Changer de plan</Link>
        </p>
      </div>
    </div>
  )
}

export default function AbonnementPage() {
  return (
    <Suspense>
      <AbonnementContent />
    </Suspense>
  )
}
