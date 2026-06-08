'use client'

import { useActionState, useState } from 'react'
import { enregistrerTransaction } from '@/lib/actions/transactions'
import { formatMontant, formatDate } from '@/lib/utils'
import { ArrowDownCircle, ArrowUpCircle, Plus, X } from 'lucide-react'

interface Reseau { id: string; nom: string; couleur: string }
interface Agent { id: string; nom_complet: string }
interface Transaction {
  id: string
  type: 'RETRAIT' | 'DEPOT'
  montant: number
  note: string | null
  created_at: string
  reseaux: { nom: string; couleur: string }
  agents: { nom_complet: string } | null
}

export default function TransactionsList({
  transactions, reseaux, agents, pointId
}: {
  transactions: Transaction[]
  reseaux: Reseau[]
  agents: Agent[]
  pointId: string
}) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(enregistrerTransaction, {})

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500">{transactions.length} transaction(s)</span>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700"
        >
          <Plus className="w-3.5 h-3.5" />
          Nouvelle transaction
        </button>
      </div>

      {transactions.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="divide-y divide-gray-100">
            {transactions.map(t => (
              <div key={t.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  {t.type === 'DEPOT'
                    ? <ArrowDownCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    : <ArrowUpCircle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                  }
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.reseaux?.couleur }} />
                      <span className="text-sm font-medium text-gray-900">{t.reseaux?.nom}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${t.type === 'DEPOT' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                        {t.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                      <span>{formatDate(t.created_at)}</span>
                      {t.agents && <span>· {t.agents.nom_complet}</span>}
                      {t.note && <span>· {t.note}</span>}
                    </div>
                  </div>
                </div>
                <span className={`font-bold text-sm ${t.type === 'DEPOT' ? 'text-green-600' : 'text-orange-600'}`}>
                  {t.type === 'DEPOT' ? '+' : '-'}{formatMontant(t.montant)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-400 text-sm">
          Aucune transaction
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold">Nouvelle transaction</h2>
              <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            {state.error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{state.error}</div>
            )}
            {state.success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">Transaction enregistrée!</div>
            )}
            <form action={action} className="space-y-4">
              <input type="hidden" name="point_de_vente_id" value={pointId} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2.5 cursor-pointer has-[:checked]:border-green-500 has-[:checked]:bg-green-50">
                    <input type="radio" name="type" value="DEPOT" defaultChecked className="sr-only" />
                    <ArrowDownCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium">Dépôt</span>
                  </label>
                  <label className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2.5 cursor-pointer has-[:checked]:border-orange-500 has-[:checked]:bg-orange-50">
                    <input type="radio" name="type" value="RETRAIT" className="sr-only" />
                    <ArrowUpCircle className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-medium">Retrait</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Réseau *</label>
                <select name="reseau_id" required className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Choisir un réseau</option>
                  {reseaux.map(r => (
                    <option key={r.id} value={r.id}>{r.nom}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Montant (FCFA) *</label>
                <input name="montant" type="number" min={1} required className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: 25000" />
              </div>
              {agents.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Agent</label>
                  <select name="agent_id" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">— Sélectionner —</option>
                    {agents.map(a => (
                      <option key={a.id} value={a.id}>{a.nom_complet}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                <input name="note" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Optionnel" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700">
                  Annuler
                </button>
                <button type="submit" disabled={pending} className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                  {pending ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
