'use client'

import { useActionState, useState } from 'react'
import { mettreAJourUV } from '@/lib/actions/points'
import { formatMontant } from '@/lib/utils'
import { Pencil, Check, X } from 'lucide-react'

interface UVData {
  id: string
  montant: number
  montant_max: number
  seuil_alerte: number
  point_de_vente_id: string
  reseaux: { id: string; nom: string; couleur: string }
}

export default function UVCard({ uv, pointId }: { uv: UVData; pointId: string }) {
  const [editing, setEditing] = useState(false)
  const [state, action, pending] = useActionState(mettreAJourUV, {})
  const faible = uv.montant <= uv.seuil_alerte

  // Barre = UV restant / UV max (si max connu), sinon fallback sur seuil
  const reference = uv.montant_max > 0 ? uv.montant_max : Math.max(uv.seuil_alerte * 3, uv.montant)
  const pct = reference > 0 ? Math.min(100, Math.round((uv.montant / reference) * 100)) : 0

  // Couleur selon le niveau
  const barColor = uv.montant === 0
    ? 'bg-gray-300'
    : faible
      ? 'bg-red-500'
      : pct < 40
        ? 'bg-orange-400'
        : 'bg-green-500'

  return (
    <div className={`bg-white rounded-xl border p-4 ${faible ? 'border-red-200' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: uv.reseaux?.couleur }} />
          <span className="font-medium text-sm text-gray-900">{uv.reseaux?.nom}</span>
        </div>
        <div className="flex items-center gap-1">
          {faible && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">UV faible</span>}
          <button
            onClick={() => setEditing(!editing)}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-700"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <p className={`text-2xl font-bold mb-2 ${faible ? 'text-red-600' : 'text-gray-900'}`}>
        {formatMontant(uv.montant)}
      </p>

      {/* Barre de progression : UV restant / UV max */}
      <div className="mb-1 flex justify-between text-xs text-gray-400">
        <span>Seuil: {formatMontant(uv.seuil_alerte)}</span>
        <span className="tabular-nums">{pct}%</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {uv.montant_max > 0 && (
        <p className="text-xs text-gray-400 mt-1">Max: {formatMontant(uv.montant_max)}</p>
      )}

      {editing && (
        <form action={action} className="mt-3 space-y-2">
          <input type="hidden" name="uv_id" value={uv.id} />
          <input type="hidden" name="point_de_vente_id" value={pointId} />
          <div>
            <label className="block text-xs text-gray-500 mb-1">Solde UV (FCFA)</label>
            <input
              name="montant"
              type="number"
              defaultValue={uv.montant}
              min={0}
              className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Seuil d'alerte (FCFA)</label>
            <input
              name="seuil_alerte"
              type="number"
              defaultValue={uv.seuil_alerte}
              min={0}
              className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {state.error && <p className="text-xs text-red-600">{state.error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              {pending ? '...' : 'Enregistrer'}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="flex items-center justify-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
