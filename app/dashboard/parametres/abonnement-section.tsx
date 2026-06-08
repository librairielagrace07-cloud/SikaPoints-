'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Check, Crown, Zap, TrendingUp, Building2,
  ArrowUpRight, Calendar, CreditCard, Loader2,
  CheckCircle2, XCircle, Clock,
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

/* ── Définition des plans ─────────────────────────────────────────────────── */
const PLANS = [
  {
    id: 'starter',
    nom: 'Starter',
    icon: Zap,
    couleur: 'gray',
    prix: { mensuel: 0, annuel: 0 },
    features: ['1 point de vente', '1 agent', 'Historique 7 jours', '50 transactions/mois'],
  },
  {
    id: 'solo',
    nom: 'Solo',
    icon: Crown,
    couleur: 'blue',
    prix: { mensuel: 1900, annuel: 1500 },
    features: ['1 point de vente', '3 agents', 'Historique illimité', 'Transactions illimitées', 'Mode hors ligne', 'Rapports PDF & Excel'],
  },
  {
    id: 'croissance',
    nom: 'Croissance',
    icon: TrendingUp,
    couleur: 'green',
    prix: { mensuel: 4900, annuel: 3900 },
    features: ['3 points de vente', '10 agents', 'Historique illimité', 'Transactions illimitées', 'Comptabilité SYSCOHADA', 'Comparaison des points'],
  },
  {
    id: 'business',
    nom: 'Business',
    icon: Building2,
    couleur: 'purple',
    prix: { mensuel: 12900, annuel: 9900 },
    features: ['Points de vente illimités', 'Agents illimités', 'Historique illimité', 'Comptabilité SYSCOHADA', 'Support prioritaire 24/7'],
  },
]

const COULEURS: Record<string, { badge: string; bg: string; border: string; icon: string; btn: string }> = {
  gray:   { badge: 'bg-gray-100 text-gray-700',    bg: 'bg-gray-50',   border: 'border-gray-200', icon: 'bg-gray-200 text-gray-600',    btn: 'bg-gray-900 hover:bg-gray-800 text-white' },
  blue:   { badge: 'bg-blue-100 text-blue-700',    bg: 'bg-blue-50',   border: 'border-blue-200', icon: 'bg-blue-100 text-blue-600',    btn: 'bg-blue-600 hover:bg-blue-700 text-white' },
  green:  { badge: 'bg-green-100 text-green-700',  bg: 'bg-green-50',  border: 'border-green-200',icon: 'bg-green-100 text-green-600',  btn: 'bg-green-600 hover:bg-green-700 text-white' },
  purple: { badge: 'bg-purple-100 text-purple-700',bg: 'bg-purple-50', border: 'border-purple-200',icon: 'bg-purple-100 text-purple-600',btn: 'bg-purple-600 hover:bg-purple-700 text-white' },
}

function fmt(n: number) {
  return n.toLocaleString('fr-FR') + ' FCFA'
}

type Paiement = {
  id: string
  plan: string
  montant: number
  periode: string
  statut: string
  reference_geniuspay: string | null
  created_at: string
}

interface Props {
  planActuel: string
  planDebut: string | null
  paiements: Paiement[]
}

export default function AbonnementSection({ planActuel, planDebut, paiements }: Props) {
  const [periode, setPeriode] = useState<'mensuel' | 'annuel'>('mensuel')
  const [loading, setLoading] = useState<string | null>(null)

  const planInfo = PLANS.find(p => p.id === planActuel) ?? PLANS[0]
  const couleurs = COULEURS[planInfo.couleur]

  async function initierPaiement(planId: string) {
    setLoading(planId)
    try {
      const res = await fetch('/api/paiement/initier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId, periode }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur serveur')
      if (!data.checkout_url) throw new Error('URL de paiement manquante. Vérifiez la configuration GeniusPay.')
      window.location.href = data.checkout_url
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Erreur lors de la création du paiement')
      setLoading(null)
    }
  }

  const statutIcon = (s: string) => {
    if (s === 'succes')    return <CheckCircle2 className="w-4 h-4 text-green-500" />
    if (s === 'echec')     return <XCircle className="w-4 h-4 text-red-400" />
    if (s === 'annule')    return <XCircle className="w-4 h-4 text-gray-400" />
    return <Clock className="w-4 h-4 text-amber-400" />
  }
  const statutLabel = (s: string) => ({
    succes: 'Succès', echec: 'Échoué', annule: 'Annulé', en_attente: 'En attente',
  }[s] ?? s)

  return (
    <div className="space-y-6">

      {/* ── Plan actuel ──────────────────────────────────────────────────── */}
      <div className={`rounded-xl border ${couleurs.border} ${couleurs.bg} p-5`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${couleurs.icon}`}>
              <planInfo.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900 text-lg">Plan {planInfo.nom}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${couleurs.badge}`}>
                  Actif
                </span>
              </div>
              {planDebut ? (
                <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Actif depuis le {format(new Date(planDebut), 'd MMMM yyyy', { locale: fr })}
                </p>
              ) : (
                <p className="text-sm text-gray-400 mt-0.5">Plan gratuit</p>
              )}
            </div>
          </div>

          {planActuel !== 'starter' && (
            <div className="text-right shrink-0">
              <p className="text-xl font-extrabold text-gray-900">{fmt(planInfo.prix.mensuel)}</p>
              <p className="text-xs text-gray-400">/ mois</p>
            </div>
          )}
        </div>

        {/* Features du plan actuel */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {planInfo.features.map(f => (
            <div key={f} className="flex items-center gap-2 text-sm text-gray-600">
              <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* ── Changer de plan ──────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700">Changer de plan</h3>
          {/* Toggle mensuel / annuel */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setPeriode('mensuel')}
              className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${periode === 'mensuel' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setPeriode('annuel')}
              className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${periode === 'annuel' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Annuel <span className="text-green-600 font-bold">−20%</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PLANS.filter(p => p.id !== 'starter').map(plan => {
            const c = COULEURS[plan.couleur]
            const prix = periode === 'annuel' ? plan.prix.annuel : plan.prix.mensuel
            const estActuel = plan.id === planActuel
            const Icon = plan.icon

            return (
              <div
                key={plan.id}
                className={`relative rounded-xl border p-4 transition-all ${
                  estActuel
                    ? `${c.border} ${c.bg} ring-2 ring-offset-1 ring-current`
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                {estActuel && (
                  <span className="absolute -top-2.5 left-4 text-xs font-bold bg-white border border-current rounded-full px-2 py-0.5 text-gray-600">
                    Plan actuel
                  </span>
                )}

                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-1.5 rounded-lg ${c.icon}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-gray-900 text-sm">{plan.nom}</span>
                </div>

                <p className="text-xl font-extrabold text-gray-900 mb-1">{fmt(prix)}</p>
                <p className="text-xs text-gray-400 mb-3">
                  {periode === 'annuel' ? `soit ${fmt(prix * 12)} / an` : 'par mois'}
                </p>

                <ul className="space-y-1 mb-4">
                  {plan.features.slice(0, 3).map(f => (
                    <li key={f} className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Check className="w-3 h-3 text-green-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                  {plan.features.length > 3 && (
                    <li className="text-xs text-gray-400 pl-4">+{plan.features.length - 3} autres…</li>
                  )}
                </ul>

                {estActuel ? (
                  <div className={`flex items-center justify-center gap-1.5 w-full py-2 rounded-lg text-xs font-semibold ${c.badge}`}>
                    <Check className="w-3.5 h-3.5" />
                    Abonnement actif
                  </div>
                ) : (
                  <button
                    onClick={() => initierPaiement(plan.id)}
                    disabled={loading === plan.id}
                    className={`flex items-center justify-center gap-1.5 w-full py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-60 ${c.btn}`}
                  >
                    {loading === plan.id ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Redirection…</>
                    ) : (
                      <><ArrowUpRight className="w-3.5 h-3.5" /> Choisir {plan.nom}</>
                    )}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        <p className="text-xs text-gray-400 mt-3 flex items-center gap-1.5">
          <CreditCard className="w-3.5 h-3.5" />
          Paiement sécurisé via GeniusPay · Wave, Orange Money, MTN MoMo, Moov Money
        </p>
      </div>

      {/* ── Historique des paiements ─────────────────────────────────────── */}
      {paiements.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Historique des paiements</h3>
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Plan</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Période</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Montant</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paiements.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">
                      {format(new Date(p.created_at), 'd MMM yyyy', { locale: fr })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        COULEURS[PLANS.find(pl => pl.id === p.plan)?.couleur ?? 'gray'].badge
                      }`}>
                        {PLANS.find(pl => pl.id === p.plan)?.nom ?? p.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs capitalize">{p.periode}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900 text-xs">{fmt(p.montant)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        {statutIcon(p.statut)}
                        <span className={`text-xs font-medium ${
                          p.statut === 'succes' ? 'text-green-600' :
                          p.statut === 'en_attente' ? 'text-amber-600' : 'text-red-500'
                        }`}>
                          {statutLabel(p.statut)}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Lien vers page d'abonnement complète */}
      <Link
        href="/abonnement?plan=croissance&periode=mensuel"
        className="flex items-center justify-center gap-2 w-full py-2.5 border border-dashed border-gray-300 rounded-xl text-xs text-gray-500 hover:border-green-400 hover:text-green-600 transition-colors"
      >
        <ArrowUpRight className="w-3.5 h-3.5" />
        Voir tous les plans disponibles
      </Link>
    </div>
  )
}
