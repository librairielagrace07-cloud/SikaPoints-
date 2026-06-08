'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, Star } from 'lucide-react'

const PLANS = [
  {
    id: 'starter',
    nom: 'Starter',
    badge: null,
    description: 'Pour découvrir SikaPoints sans engagement.',
    prix_mensuel: 0,
    prix_annuel: 0,
    cta: 'Commencer gratuitement',
    ctaHref: '/register',
    highlight: false,
    features: [
      '1 point de vente',
      '1 agent maximum',
      'Historique 7 jours',
      '50 transactions/mois',
      'Application mobile (PWA)',
    ],
  },
  {
    id: 'solo',
    nom: 'Solo',
    badge: null,
    description: 'Pour l\'opérateur solo avec un seul point de vente.',
    prix_mensuel: 1900,
    prix_annuel: 1500,
    cta: 'Choisir Solo',
    ctaHref: '/abonnement?plan=solo',
    highlight: false,
    features: [
      '1 point de vente',
      '3 agents maximum',
      'Historique illimité',
      'Transactions illimitées',
      'Mode hors ligne',
      'Alertes UV faibles',
      'Rapports PDF & Excel',
    ],
  },
  {
    id: 'croissance',
    nom: 'Croissance',
    badge: 'Populaire',
    description: 'Pour les opérateurs qui gèrent jusqu\'à 3 points de vente.',
    prix_mensuel: 4900,
    prix_annuel: 3900,
    cta: 'Choisir Croissance',
    ctaHref: '/abonnement?plan=croissance',
    highlight: true,
    features: [
      '3 points de vente',
      '10 agents maximum',
      'Historique illimité',
      'Transactions illimitées',
      'Mode hors ligne',
      'Alertes UV faibles',
      'Rapports PDF & Excel',
      'Comptabilité SYSCOHADA',
      'Export multi-périodes',
      'Comparaison des points',
    ],
  },
  {
    id: 'business',
    nom: 'Business',
    badge: null,
    description: 'Pour les grands réseaux avec plusieurs points de vente.',
    prix_mensuel: 12900,
    prix_annuel: 9900,
    cta: 'Choisir Business',
    ctaHref: '/abonnement?plan=business',
    highlight: false,
    features: [
      'Points de vente illimités',
      'Agents illimités',
      'Historique illimité',
      'Transactions illimitées',
      'Mode hors ligne',
      'Alertes UV faibles',
      'Rapports PDF & Excel',
      'Comptabilité SYSCOHADA',
      'Export multi-périodes',
      'Comparaison des points',
      'Support prioritaire 24/7',
    ],
  },
]

function fmt(n: number) {
  return n.toLocaleString('fr-FR') + ' FCFA'
}

export default function PricingSection() {
  const [annuel, setAnnuel] = useState(false)

  return (
    <section id="tarifs" className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-sm font-semibold text-green-600 uppercase tracking-widest">Tarifs</span>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mt-2 mb-4">
            Le bon plan pour chaque taille
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Démarrez gratuitement, évoluez selon vos besoins. Sans engagement, résiliez à tout moment.
          </p>

          {/* Toggle mensuel / annuel */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <span className={`text-sm font-medium ${!annuel ? 'text-gray-900' : 'text-gray-400'}`}>Mensuel</span>
            <button
              onClick={() => setAnnuel(a => !a)}
              className={`relative w-12 h-6 rounded-full transition-colors ${annuel ? 'bg-green-600' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${annuel ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
            <span className={`text-sm font-medium ${annuel ? 'text-gray-900' : 'text-gray-400'}`}>
              Annuel
              <span className="ml-1.5 bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">-20%</span>
            </span>
          </div>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {PLANS.map(plan => {
            const prix = annuel && plan.prix_annuel > 0 ? plan.prix_annuel : plan.prix_mensuel
            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-6 flex flex-col ${
                  plan.highlight
                    ? 'bg-green-600 text-white shadow-2xl shadow-green-200 ring-2 ring-green-500'
                    : 'bg-white border border-gray-200 shadow-sm'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="flex items-center gap-1 bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-full shadow">
                      <Star className="w-3 h-3 fill-current" />
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className={`text-lg font-bold mb-1 ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>{plan.nom}</h3>
                  <p className={`text-sm leading-relaxed ${plan.highlight ? 'text-green-100' : 'text-gray-500'}`}>{plan.description}</p>
                </div>

                <div className="mb-6">
                  {prix === 0 ? (
                    <div className="flex items-end gap-1">
                      <span className={`text-4xl font-extrabold ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>Gratuit</span>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-end gap-1">
                        <span className={`text-4xl font-extrabold ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>
                          {fmt(prix)}
                        </span>
                      </div>
                      <p className={`text-xs mt-1 ${plan.highlight ? 'text-green-100' : 'text-gray-400'}`}>
                        {annuel ? `soit ${fmt(prix * 12)} / an` : 'par mois'}
                      </p>
                    </div>
                  )}
                </div>

                <ul className="space-y-2.5 flex-1 mb-8">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <Check className={`w-4 h-4 mt-0.5 shrink-0 ${plan.highlight ? 'text-green-200' : 'text-green-500'}`} />
                      <span className={plan.highlight ? 'text-green-50' : 'text-gray-600'}>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.id === 'starter' ? plan.ctaHref : `${plan.ctaHref}&periode=${annuel ? 'annuel' : 'mensuel'}`}
                  className={`block text-center py-3 rounded-xl text-sm font-semibold transition-colors ${
                    plan.highlight
                      ? 'bg-white text-green-700 hover:bg-green-50'
                      : plan.id === 'starter'
                      ? 'bg-gray-900 text-white hover:bg-gray-800'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            )
          })}
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          Prix en FCFA · TVA incluse · Paiement par Mobile Money ou virement
        </p>
      </div>
    </section>
  )
}
