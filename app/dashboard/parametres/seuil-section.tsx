'use client'

import { useActionState } from 'react'
import { definirSeuilDefaut } from '@/lib/actions/parametres'
import { Check } from 'lucide-react'

export default function SeuilSection({ seuilActuel }: { seuilActuel: number }) {
  const [state, action, pending] = useActionState(definirSeuilDefaut, {})

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Ce seuil sera utilisé par défaut lors de la création de nouveaux points de vente.
        Vous pourrez toujours l'ajuster réseau par réseau depuis la fiche du point.
      </p>

      {state.error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{state.error}</div>
      )}
      {state.success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
          <Check className="w-4 h-4" /> {state.success}
        </div>
      )}

      <form action={action} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Seuil d'alerte par défaut (FCFA)
          </label>
          <input
            name="seuil_defaut"
            type="number"
            min={0}
            step={5000}
            defaultValue={seuilActuel}
            required
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ex: 50000"
          />
          <p className="text-xs text-gray-400 mt-1">Valeur actuelle : {seuilActuel.toLocaleString('fr-FR')} FCFA</p>
        </div>

        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            name="appliquer_existants"
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5"
          />
          <div>
            <span className="text-sm text-gray-700">Appliquer à tous mes points de vente existants</span>
            <p className="text-xs text-gray-400">Mettra à jour le seuil de tous les UV de vos points actuels</p>
          </div>
        </label>

        <button
          type="submit"
          disabled={pending}
          className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {pending ? 'Enregistrement...' : 'Enregistrer le seuil'}
        </button>
      </form>
    </div>
  )
}
