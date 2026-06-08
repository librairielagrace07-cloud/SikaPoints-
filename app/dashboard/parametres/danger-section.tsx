'use client'

import { useActionState, useState } from 'react'
import { supprimerCompte } from '@/lib/actions/parametres'
import { useRouter } from 'next/navigation'
import { Trash2, AlertTriangle } from 'lucide-react'

export default function DangerSection() {
  const [confirm, setConfirm] = useState(false)
  const [state, action, pending] = useActionState(supprimerCompte, {})
  const router = useRouter()

  if (state.success) {
    router.push('/login')
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-100 rounded-lg">
        <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
        <p className="text-sm text-red-700">
          La suppression de votre compte est <strong>irréversible</strong>. Tous vos points de vente, agents, transactions et données seront définitivement supprimés.
        </p>
      </div>

      {!confirm ? (
        <button
          type="button"
          onClick={() => setConfirm(true)}
          className="flex items-center gap-2 px-4 py-2.5 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Supprimer mon compte
        </button>
      ) : (
        <form action={action} className="space-y-3">
          {state.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{state.error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tapez <strong>SUPPRIMER</strong> pour confirmer
            </label>
            <input
              name="confirmation"
              required
              className="w-full px-3 py-2.5 border border-red-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="SUPPRIMER"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setConfirm(false)}
              className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={pending}
              className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
            >
              {pending ? 'Suppression...' : 'Supprimer définitivement'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
