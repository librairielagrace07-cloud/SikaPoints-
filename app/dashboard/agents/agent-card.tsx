'use client'

import { useActionState, useState } from 'react'
import { modifierAgent, modifierPermissions, reinitialiserMotDePasse } from '@/lib/actions/agents'
import { Phone, Store, ChevronDown, ChevronUp, Key, Check, Pencil } from 'lucide-react'

interface Agent {
  id: string
  nom_complet: string
  telephone: string | null
  actif: boolean
  peut_deposer: boolean
  peut_retirer: boolean
  peut_voir_rapports: boolean
  peut_modifier_uv: boolean
  peut_recharger_uv: boolean
  points_de_vente: { nom: string } | null
}

const PERMISSIONS = [
  { key: 'peut_deposer', label: 'Dépôts' },
  { key: 'peut_retirer', label: 'Retraits' },
  { key: 'peut_voir_rapports', label: 'Rapports' },
  { key: 'peut_modifier_uv', label: 'Modifier UV' },
  { key: 'peut_recharger_uv', label: 'Recharger UV' },
] as const

export default function AgentCard({ agent }: { agent: Agent }) {
  const [expanded, setExpanded] = useState(false)
  const [showMdpForm, setShowMdpForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)

  const [editState, editAction, editPending] = useActionState(modifierAgent, {})
  const [permState, permAction, permPending] = useActionState(modifierPermissions, {})
  const [mdpState, mdpAction, mdpPending] = useActionState(reinitialiserMotDePasse, {})

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* En-tête */}
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold flex-shrink-0">
            {agent.nom_complet.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{agent.nom_complet}</p>
            <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
              {agent.telephone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />{agent.telephone}
                </span>
              )}
              {agent.points_de_vente && (
                <span className="flex items-center gap-1">
                  <Store className="w-3 h-3" />{agent.points_de_vente.nom}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex gap-1 flex-wrap">
            {PERMISSIONS.map(p => (
              <span
                key={p.key}
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  agent[p.key] ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400 line-through'
                }`}
              >
                {p.label}
              </span>
            ))}
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${
            agent.actif ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
          }`}>
            {agent.actif ? 'Actif' : 'Suspendu'}
          </span>
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </div>

      {/* Panneau d'édition */}
      {expanded && (
        <div className="border-t border-gray-100 px-5 py-4 bg-gray-50 space-y-5">

          {/* — Informations de l'agent — */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Informations</p>
              <button
                type="button"
                onClick={() => setShowEditForm(!showEditForm)}
                className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
              >
                <Pencil className="w-3 h-3" />
                {showEditForm ? 'Annuler' : 'Modifier'}
              </button>
            </div>

            {!showEditForm ? (
              <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Nom</span>
                  <span className="font-medium text-gray-900">{agent.nom_complet}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Téléphone</span>
                  <span className="font-medium text-gray-900">{agent.telephone ?? '—'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Point de vente</span>
                  <span className="font-medium text-gray-900">{agent.points_de_vente?.nom ?? '—'}</span>
                </div>
              </div>
            ) : (
              <form action={editAction} className="space-y-3">
                <input type="hidden" name="agent_id" value={agent.id} />
                {(editState as { error?: string }).error && (
                  <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
                    {(editState as { error?: string }).error}
                  </div>
                )}
                {(editState as { success?: boolean }).success && (
                  <div className="p-2 bg-green-50 border border-green-200 rounded-lg text-green-700 text-xs flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Informations mises à jour
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nom complet</label>
                  <input
                    name="nom_complet"
                    required
                    defaultValue={agent.nom_complet}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Téléphone <span className="text-gray-400">(identifiant de connexion)</span>
                  </label>
                  <input
                    name="telephone"
                    type="tel"
                    required
                    defaultValue={agent.telephone ?? ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEditForm(false)}
                    className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={editPending}
                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    {editPending ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* — Permissions — */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Permissions</p>
            {(permState as { error?: string }).error && (
              <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
                {(permState as { error?: string }).error}
              </div>
            )}
            {(permState as { success?: boolean }).success && (
              <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-lg text-green-700 text-xs flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Permissions mises à jour
              </div>
            )}
            <form action={permAction} className="space-y-3">
              <input type="hidden" name="agent_id" value={agent.id} />
              <div className="grid grid-cols-2 gap-2">
                {PERMISSIONS.map(perm => (
                  <label key={perm.key} className="flex items-center gap-2.5 cursor-pointer bg-white rounded-lg px-3 py-2.5 border border-gray-200 hover:border-blue-300 transition-colors">
                    <input
                      type="checkbox"
                      name={perm.key}
                      defaultChecked={agent[perm.key]}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{perm.label}</span>
                  </label>
                ))}
              </div>
              <div className="flex items-center gap-2.5 bg-white rounded-lg px-3 py-2.5 border border-gray-200">
                <label className="flex items-center gap-2.5 cursor-pointer flex-1">
                  <input
                    type="checkbox"
                    name="actif"
                    defaultChecked={agent.actif}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 font-medium">Compte actif</span>
                </label>
                <span className="text-xs text-gray-400">Désactiver suspend l'accès</span>
              </div>
              <button
                type="submit"
                disabled={permPending}
                className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {permPending ? 'Enregistrement...' : 'Enregistrer les permissions'}
              </button>
            </form>
          </div>

          {/* — Mot de passe — */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Mot de passe</p>
              <button
                type="button"
                onClick={() => setShowMdpForm(!showMdpForm)}
                className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
              >
                <Key className="w-3 h-3" />
                {showMdpForm ? 'Annuler' : 'Changer le mot de passe'}
              </button>
            </div>
            {showMdpForm && (
              <form action={mdpAction} className="space-y-2">
                <input type="hidden" name="agent_id" value={agent.id} />
                {(mdpState as { error?: string }).error && (
                  <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
                    {(mdpState as { error?: string }).error}
                  </div>
                )}
                {(mdpState as { success?: boolean }).success && (
                  <div className="p-2 bg-green-50 border border-green-200 rounded-lg text-green-700 text-xs flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Mot de passe mis à jour
                  </div>
                )}
                <input
                  name="nouveau_mdp"
                  type="password"
                  required
                  minLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nouveau mot de passe (min. 6 caractères)"
                />
                <button
                  type="submit"
                  disabled={mdpPending}
                  className="w-full py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
                >
                  {mdpPending ? '...' : 'Mettre à jour le mot de passe'}
                </button>
              </form>
            )}
          </div>

        </div>
      )}
    </div>
  )
}
