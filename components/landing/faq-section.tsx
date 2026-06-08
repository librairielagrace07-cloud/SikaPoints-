'use client'

import { useState } from 'react'
import { Plus, Minus } from 'lucide-react'

const FAQ = [
  {
    q: 'SikaPoints fonctionne-t-il sans connexion internet ?',
    a: 'Oui. SikaPoints dispose d\'un mode hors ligne complet. Toutes vos saisies de transactions sont stockées localement sur l\'appareil et synchronisées automatiquement avec le serveur dès la reconnexion. Vous ne perdez aucune donnée.',
  },
  {
    q: 'Quels réseaux Mobile Money sont pris en charge ?',
    a: 'SikaPoints supporte Wave, Orange Money, MTN MoMo et Moov Money. Vous pouvez gérer les UV (Unités de Valeur) et transactions de chaque réseau indépendamment, avec des alertes configurables par réseau.',
  },
  {
    q: 'Comment fonctionne la gestion multi-agents ?',
    a: 'Vous créez des comptes agents et leur assignez des permissions précises : autoriser ou non les dépôts, les retraits, ou les modifications d\'UV. Chaque transaction est horodatée et liée à l\'agent qui l\'a saisie.',
  },
  {
    q: 'La comptabilité SYSCOHADA est-elle incluse dans tous les plans ?',
    a: 'La comptabilité SYSCOHADA (journal, balance des comptes, compte de résultat) est disponible à partir du plan Croissance. Le plan Starter ne comprend pas cette fonctionnalité.',
  },
  {
    q: 'Puis-je changer de plan ou résilier à tout moment ?',
    a: 'Absolument. Vous pouvez upgrader, downgrader ou résilier votre abonnement à tout moment depuis les paramètres de votre compte. Aucun engagement minimum, aucun frais de résiliation.',
  },
  {
    q: 'Comment sont sécurisées mes données ?',
    a: 'Toutes vos données sont stockées en base de données Supabase avec chiffrement en transit (TLS) et au repos. L\'accès est protégé par Row Level Security : chaque propriétaire ne voit que ses propres points de vente et données.',
  },
  {
    q: 'L\'export PDF et Excel inclut-il les données par point de vente ?',
    a: 'Oui. Depuis la page Rapports ou Bilan SYSCOHADA, vous pouvez exporter un rapport global (tous vos points confondus) ou sélectionner un point de vente spécifique pour un export ciblé.',
  },
]

export default function FaqSection() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section id="faq" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">
          {/* Left */}
          <div className="lg:col-span-2">
            <span className="text-sm font-semibold text-green-600 uppercase tracking-widest">FAQ</span>
            <h2 className="text-3xl font-bold text-gray-900 mt-2 mb-4 leading-tight">
              Support disponible<br />24h/24, 7j/7
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              Une question sur SikaPoints ? Consultez notre FAQ ou contactez notre support directement.
            </p>
            <a
              href="mailto:support@sikapoints.ci"
              className="inline-flex items-center gap-2 bg-green-600 text-white px-5 py-3 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors"
            >
              Contacter le support →
            </a>
          </div>

          {/* Right */}
          <div className="lg:col-span-3 space-y-3">
            {FAQ.map((item, i) => (
              <div
                key={i}
                className="border border-gray-200 rounded-xl overflow-hidden"
              >
                <button
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                  onClick={() => setOpen(open === i ? null : i)}
                >
                  <span className="text-sm font-medium text-gray-900">{item.q}</span>
                  {open === i
                    ? <Minus className="w-4 h-4 text-green-600 shrink-0" />
                    : <Plus  className="w-4 h-4 text-gray-400 shrink-0" />
                  }
                </button>
                {open === i && (
                  <div className="px-5 pb-5 text-sm text-gray-600 leading-relaxed border-t border-gray-100 bg-gray-50/50">
                    <p className="pt-4">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
