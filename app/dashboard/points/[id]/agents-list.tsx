'use client'

import { useActionState, useState } from 'react'
import { creerCompteAgent } from '@/lib/actions/agents'
import { Users, Plus, X, Phone, Mail, Eye, EyeOff } from 'lucide-react'

interface Agent {
  id: string
  nom_complet: string
  telephone: string | null
  email: string | null
  actif: boolean
}

const PERMISSIONS = [
  { key: 'peut_deposer', label: 'Dépôts', defaultOn: true },
  { key: 'peut_retirer', label: 'Retraits', defaultOn: true },
  { key: 'peut_voir_rapports', label: 'Rapports', defaultOn: false },
  { key: 'peut_modifier_uv', label: 'Modifier UV', defaultOn: false },
  { key: 'peut_recharger_uv', label: 'Recharger UV', defaultOn: false },
]

export default function AgentsList({ agents, pointId }: { agents: Agent[]; pointId: string }) {
  const [open, setOpen] = useState(false)
  const [showMdp, setShowMdp] = useState(false)
  const [state, action, pending] = useActionState(creerCompteAgent, {})

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-900">Agents ({agents.length})</h2>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700"
        >
          <Plus className="w-3.5 h-3.5" />
          Créer un agent
        </button>
      </div>

      {agents.length > 0 ? (
        <div className="space-y-2">
          {agents.map(agent => (
            <div key={agent.id} className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm">
                  {agent.nom_complet.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-sm text-gray-900">{agent.nom_complet}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    {agent.telephone && (
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{agent.telephone}</span>
                    )}
                  </div>
                </div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${agent.actif ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {agent.actif ? 'Actif' : 'Inactif'}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
          <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">Aucun agent pour ce point</p>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold">Créer un agent</h2>
                <p className="text-xs text-gray-400">L'agent se connecte avec son téléphone</p>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            {(state as { error?: string; success?: boolean }).error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {(state as { error?: string }).error}
              </div>
            )}
            {(state as { success?: boolean }).success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                ✓ Compte créé ! L'agent peut se connecter avec son numéro et mot de passe.
              </div>
            )}
            <form action={action} className="space-y-4">
              <input type="hidden" name="point_de_vente_id" value={pointId} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet *</label>
                <input name="nom_complet" required className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone * <span className="text-gray-400 font-normal">(pour se connecter)</span>
                </label>
                <input name="telephone" type="tel" required className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="+225 07 00 00 00 00" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe *</label>
                <div className="relative">
                  <input
                    name="mot_de_passe"
                    type={showMdp ? 'text' : 'password'}
                    required
                    minLength={6}
                    className="w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Au moins 6 caractères"
                  />
                  <button type="button" onClick={() => setShowMdp(!showMdp)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showMdp ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                <div className="space-y-2 bg-gray-50 rounded-xl p-3">
                  {PERMISSIONS.map(perm => (
                    <label key={perm.key} className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" name={perm.key} defaultChecked={perm.defaultOn} className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                      <span className="text-sm text-gray-700">{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700">
                  Annuler
                </button>
                <button type="submit" disabled={pending} className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                  {pending ? 'Création...' : 'Créer le compte'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
