'use client'

import { useActionState, useState } from 'react'
import { creerCompteAgent } from '@/lib/actions/agents'
import { Plus, X, Eye, EyeOff, Lock } from 'lucide-react'
import Link from 'next/link'

interface Point { id: string; nom: string }

interface Props {
  points: Point[]
  atLimit: boolean
  maxAgents: number
}

const PERMISSIONS = [
  { key: 'peut_deposer', label: 'Faire des dépôts', defaultOn: true },
  { key: 'peut_retirer', label: 'Faire des retraits', defaultOn: true },
  { key: 'peut_voir_rapports', label: 'Voir les rapports', defaultOn: false },
  { key: 'peut_modifier_uv', label: 'Modifier l\'UV manuellement', defaultOn: false },
]

export default function NouvelAgentForm({ points, atLimit, maxAgents }: Props) {
  const [open, setOpen] = useState(false)
  const [showMdp, setShowMdp] = useState(false)
  const [state, action, pending] = useActionState(creerCompteAgent, {})

  if (atLimit) {
    return (
      <Link
        href="/dashboard/parametres?onglet=abonnement"
        className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-100 transition-colors"
      >
        <Lock className="w-4 h-4" />
        Limite atteinte ({maxAgents} max)
      </Link>
    )
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Créer un agent
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Créer un compte agent</h2>
                <p className="text-xs text-gray-400 mt-0.5">L'agent se connecte avec son téléphone</p>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {state.error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {state.error}
              </div>
            )}
            {state.success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                ✓ Compte créé ! L'agent peut maintenant se connecter avec son numéro et ce mot de passe.
              </div>
            )}

            <form action={action} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Point de vente *</label>
                <select name="point_de_vente_id" required className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Choisir un point</option>
                  {points.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet *</label>
                <input
                  name="nom_complet"
                  required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Kouassi Amani"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Numéro de téléphone * <span className="text-gray-400 font-normal">(utilisé pour se connecter)</span>
                </label>
                <input
                  name="telephone"
                  type="tel"
                  required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+225 07 00 00 00 00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mot de passe *
                </label>
                <div className="relative">
                  <input
                    name="mot_de_passe"
                    type={showMdp ? 'text' : 'password'}
                    required
                    minLength={6}
                    className="w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Au moins 6 caractères"
                  />
                  <button
                    type="button"
                    onClick={() => setShowMdp(!showMdp)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showMdp ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Permissions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                <div className="space-y-2 bg-gray-50 rounded-xl p-3">
                  {PERMISSIONS.map(perm => (
                    <label key={perm.key} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        name={perm.key}
                        defaultChecked={perm.defaultOn}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 group-hover:text-gray-900">{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {pending ? 'Création...' : 'Créer le compte'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
