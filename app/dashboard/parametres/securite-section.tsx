'use client'

import { useActionState, useState } from 'react'
import { changerMotDePasse } from '@/lib/actions/parametres'
import { Check, Eye, EyeOff } from 'lucide-react'

export default function SecuriteSection() {
  const [state, action, pending] = useActionState(changerMotDePasse, {})
  const [showActuel, setShowActuel] = useState(false)
  const [showNouveau, setShowNouveau] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  return (
    <form action={action} className="space-y-4">
      {state.error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{state.error}</div>
      )}
      {state.success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
          <Check className="w-4 h-4" /> {state.success}
        </div>
      )}

      <PasswordField
        name="mdp_actuel"
        label="Mot de passe actuel"
        show={showActuel}
        onToggle={() => setShowActuel(!showActuel)}
      />
      <PasswordField
        name="nouveau_mdp"
        label="Nouveau mot de passe"
        show={showNouveau}
        onToggle={() => setShowNouveau(!showNouveau)}
        hint="Minimum 6 caractères"
      />
      <PasswordField
        name="confirmer_mdp"
        label="Confirmer le nouveau mot de passe"
        show={showConfirm}
        onToggle={() => setShowConfirm(!showConfirm)}
      />

      <button
        type="submit"
        disabled={pending}
        className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
      >
        {pending ? 'Mise à jour...' : 'Changer le mot de passe'}
      </button>
    </form>
  )
}

function PasswordField({
  name,
  label,
  show,
  onToggle,
  hint,
}: {
  name: string
  label: string
  show: boolean
  onToggle: () => void
  hint?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <input
          name={name}
          type={show ? 'text' : 'password'}
          required
          minLength={name === 'mdp_actuel' ? 1 : 6}
          className="w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          tabIndex={-1}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}
