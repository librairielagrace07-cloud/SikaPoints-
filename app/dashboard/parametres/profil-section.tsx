'use client'

import { useActionState, useState } from 'react'
import { modifierProfil } from '@/lib/actions/parametres'
import { Check, Pencil } from 'lucide-react'

interface Props {
  nomActuel: string
  email: string
  role: 'PROPRIETAIRE' | 'AGENT'
  telephone: string | null
  dateInscription: string
}

export default function ProfilSection({ nomActuel, email, role, telephone, dateInscription }: Props) {
  const [editing, setEditing] = useState(false)
  const [state, action, pending] = useActionState(modifierProfil, {})

  const dateStr = dateInscription
    ? new Date(dateInscription).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—'

  return (
    <div className="space-y-4">
      {/* Infos en lecture seule */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
        <InfoRow label="Rôle" value={role === 'PROPRIETAIRE' ? 'Propriétaire' : 'Agent'} />
        <InfoRow label="Email" value={email} />
        {telephone && <InfoRow label="Téléphone" value={telephone} />}
        <InfoRow label="Membre depuis" value={dateStr} />
      </div>

      <hr className="border-gray-100" />

      {/* Modifier le nom */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-gray-700">Nom complet</p>
          {!editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
            >
              <Pencil className="w-3 h-3" /> Modifier
            </button>
          )}
        </div>

        {!editing ? (
          <p className="text-gray-900 font-medium">{nomActuel}</p>
        ) : (
          <form action={action} className="space-y-3" onSubmit={() => setEditing(false)}>
            {state.error && (
              <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">{state.error}</div>
            )}
            {state.success && (
              <div className="p-2 bg-green-50 border border-green-200 rounded-lg text-green-700 text-xs flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> {state.success}
              </div>
            )}
            <input
              name="nom_complet"
              required
              defaultValue={nomActuel}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Votre nom complet"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={pending}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {pending ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-gray-900 font-medium truncate">{value}</p>
    </div>
  )
}
