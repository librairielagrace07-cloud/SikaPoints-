'use client'

import { useActionState, useTransition } from 'react'
import { sauvegarderTauxCommission } from '@/lib/actions/depenses'
import { Loader2, Percent } from 'lucide-react'

interface Reseau { id: string; nom: string; couleur: string }
interface TauxMap { [id: string]: { taux_depot: number; taux_retrait: number } }

export default function TauxCommissionForm({ reseaux, taux }: { reseaux: Reseau[]; taux: TauxMap }) {
  const [state, action] = useActionState(sauvegarderTauxCommission, {})
  const [isPending, startTransition] = useTransition()

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-1">
        <Percent className="w-4 h-4 text-blue-600" />
        <h2 className="font-semibold text-gray-900">Taux de commission</h2>
      </div>
      <p className="text-xs text-gray-400 mb-4">
        Configurez vos taux pour calculer vos produits automatiquement
      </p>

      <form action={(fd) => startTransition(() => action(fd))} className="space-y-3">
        <div className="grid grid-cols-3 gap-2 text-xs font-medium text-gray-500 pb-1 border-b border-gray-100">
          <span>Réseau</span>
          <span className="text-center">Dépôt (%)</span>
          <span className="text-center">Retrait (%)</span>
        </div>
        {reseaux.map(r => {
          const t = taux[r.id]
          return (
            <div key={r.id} className="grid grid-cols-3 gap-2 items-center">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: r.couleur }} />
                <span className="text-sm font-medium text-gray-800 truncate">{r.nom}</span>
              </div>
              <input
                type="number"
                name={`depot_${r.id}`}
                defaultValue={t ? +(t.taux_depot * 100).toFixed(4) : 0}
                min={0} max={100} step={0.0001}
                className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                name={`retrait_${r.id}`}
                defaultValue={t ? +(t.taux_retrait * 100).toFixed(4) : 0}
                min={0} max={100} step={0.0001}
                className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )
        })}

        {state.error   && <p className="text-sm text-red-600">{state.error}</p>}
        {state.success && <p className="text-sm text-green-600">{state.success}</p>}

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
        >
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          Enregistrer les taux
        </button>
      </form>
    </div>
  )
}
