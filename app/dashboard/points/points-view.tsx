'use client'

import { useState } from 'react'
import Link from 'next/link'
import { LayoutGrid, TableProperties, Store, MapPin, Phone, AlertTriangle } from 'lucide-react'
import ComparaisonTable from './comparaison-table'
import type { PointStat } from './page'
import { formatMontant } from '@/lib/utils'

type Vue = 'cartes' | 'tableau'

export default function PointsView({ stats }: { stats: PointStat[] }) {
  const [vue, setVue] = useState<Vue>('cartes')

  if (stats.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <Store className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="font-semibold text-gray-700 mb-2">Aucun point de vente</h3>
        <p className="text-gray-400 text-sm">Créez votre premier point de vente pour commencer</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toggle vue */}
      <div className="flex items-center gap-2">
        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1">
          <button
            onClick={() => setVue('cartes')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              vue === 'cartes'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            Cartes
          </button>
          <button
            onClick={() => setVue('tableau')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              vue === 'tableau'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <TableProperties className="w-4 h-4" />
            Comparer
          </button>
        </div>
        {vue === 'tableau' && (
          <p className="text-xs text-gray-400">Triez par colonne · données cumulées depuis la création</p>
        )}
      </div>

      {/* Vue cartes */}
      {vue === 'cartes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {stats.map(s => (
            <Link
              key={s.id}
              href={`/dashboard/points/${s.id}`}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                    <Store className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                      {s.nom}
                    </h3>
                    <p className="text-xs text-gray-400">{s.agentsCount} agent(s)</p>
                  </div>
                </div>
                {s.uvFaibles > 0 && (
                  <span className="flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                    <AlertTriangle className="w-3 h-3" />
                    {s.uvFaibles} UV faible{s.uvFaibles > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {s.adresse && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                  <MapPin className="w-3 h-3" />
                  {s.adresse}
                </div>
              )}
              {s.telephone && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
                  <Phone className="w-3 h-3" />
                  {s.telephone}
                </div>
              )}

              {/* Stats journalières */}
              <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                <div className="bg-green-50 rounded-lg px-2.5 py-1.5">
                  <p className="text-green-600 font-medium">Dépôts aujourd'hui</p>
                  <p className="font-bold text-green-800 tabular-nums">{formatMontant(s.depotsJour)}</p>
                </div>
                <div className="bg-orange-50 rounded-lg px-2.5 py-1.5">
                  <p className="text-orange-600 font-medium">Retraits aujourd'hui</p>
                  <p className="font-bold text-orange-800 tabular-nums">{formatMontant(s.retraitsJour)}</p>
                </div>
              </div>

              {/* UV par réseau */}
              <div className="flex flex-wrap gap-1.5">
                {s.uvList.map((uv, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-50 border"
                    style={{ borderColor: uv.montant <= uv.seuil_alerte ? '#fca5a5' : '#e5e7eb' }}
                  >
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: uv.couleur }} />
                    <span className={uv.montant <= uv.seuil_alerte ? 'text-red-600 font-medium' : 'text-gray-600'}>
                      {uv.nom}
                    </span>
                  </div>
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Vue tableau comparatif */}
      {vue === 'tableau' && <ComparaisonTable stats={stats} />}
    </div>
  )
}
