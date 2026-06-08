'use client'

import { useActionState, useState, useEffect, startTransition } from 'react'
import { enregistrerTransaction } from '@/lib/actions/transactions'
import { createClient } from '@/lib/supabase/client'
import { addPendingTx } from '@/lib/offline/db'
import { useOffline } from '@/hooks/use-offline'
import { ArrowDownCircle, ArrowUpCircle, Plus, X, WifiOff } from 'lucide-react'

interface Reseau { id: string; nom: string; couleur: string }
interface Point  { id: string; nom: string }
interface Agent  { id: string; nom_complet: string }

interface Props {
  points:              Point[]
  reseaux:             Reseau[]
  peut_deposer:        boolean
  peut_retirer:        boolean
  point_de_vente_fixe: string | null
  agent_id_fixe:       string | null
}

export default function NouvelleTransactionForm({
  points, reseaux, peut_deposer, peut_retirer, point_de_vente_fixe, agent_id_fixe,
}: Props) {
  const [open,          setOpen]          = useState(false)
  const [state, action, pending]          = useActionState(enregistrerTransaction, {})
  const [selectedPoint, setSelectedPoint] = useState(point_de_vente_fixe ?? '')
  const [agents,        setAgents]        = useState<Agent[]>([])
  const [offlineQueued, setOfflineQueued] = useState(false)
  const { isOnline, refreshCount } = useOffline()

  const defaultType = peut_deposer ? 'DEPOT' : 'RETRAIT'

  useEffect(() => {
    if (!selectedPoint) return
    const supabase = createClient()
    supabase
      .from('agents')
      .select('id, nom_complet')
      .eq('point_de_vente_id', selectedPoint)
      .eq('actif', true)
      .then(({ data }) => setAgents(data ?? []))
  }, [selectedPoint])

  // Ferme le modal après une soumission en ligne réussie
  useEffect(() => {
    if (state.success) setTimeout(() => setOpen(false), 800)
  }, [state.success])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)

    if (!navigator.onLine) {
      try {
        await addPendingTx({
          localId:           crypto.randomUUID(),
          point_de_vente_id: fd.get('point_de_vente_id') as string,
          reseau_id:         fd.get('reseau_id') as string,
          type:              fd.get('type') as 'DEPOT' | 'RETRAIT',
          montant:           Number(fd.get('montant')),
          note:              (fd.get('note') as string) || null,
          agent_id:          (fd.get('agent_id') as string) || null,
          created_at:        new Date().toISOString(),
        })
        setOfflineQueued(true)
        await refreshCount()
        setTimeout(() => { setOfflineQueued(false); setOpen(false) }, 1800)
      } catch {
        /* IndexedDB indisponible */
      }
      return
    }

    // En ligne → server action normale
    startTransition(() => action(fd))
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
      >
        <Plus className="w-4 h-4" />
        Nouvelle transaction
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">Nouvelle transaction</h2>
                {!isOnline && (
                  <span className="flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                    <WifiOff className="w-3 h-3" />
                    Hors ligne
                  </span>
                )}
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
                Transaction enregistrée !
              </div>
            )}
            {offlineQueued && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
                Sauvegardée hors ligne · sera envoyée automatiquement à la reconnexion
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                {peut_deposer && peut_retirer ? (
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2.5 cursor-pointer has-checked:border-green-500 has-checked:bg-green-50">
                      <input type="radio" name="type" value="DEPOT" defaultChecked className="sr-only" />
                      <ArrowDownCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium">Dépôt</span>
                    </label>
                    <label className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2.5 cursor-pointer has-checked:border-orange-500 has-checked:bg-orange-50">
                      <input type="radio" name="type" value="RETRAIT" className="sr-only" />
                      <ArrowUpCircle className="w-4 h-4 text-orange-500" />
                      <span className="text-sm font-medium">Retrait</span>
                    </label>
                  </div>
                ) : (
                  <div>
                    <input type="hidden" name="type" value={defaultType} />
                    <div className={`flex items-center gap-2 border rounded-lg px-3 py-2.5 ${defaultType === 'DEPOT' ? 'border-green-500 bg-green-50' : 'border-orange-500 bg-orange-50'}`}>
                      {defaultType === 'DEPOT'
                        ? <ArrowDownCircle className="w-4 h-4 text-green-600" />
                        : <ArrowUpCircle  className="w-4 h-4 text-orange-500" />
                      }
                      <span className="text-sm font-medium">{defaultType === 'DEPOT' ? 'Dépôt' : 'Retrait'}</span>
                      <span className="text-xs text-gray-400 ml-auto">(seule option autorisée)</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Point de vente */}
              {point_de_vente_fixe ? (
                <>
                  <input type="hidden" name="point_de_vente_id" value={point_de_vente_fixe} />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Point de vente</label>
                    <div className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-600">
                      {points[0]?.nom ?? 'Votre point de vente'}
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Point de vente *</label>
                  <select
                    name="point_de_vente_id"
                    required
                    value={selectedPoint}
                    onChange={e => setSelectedPoint(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choisir un point</option>
                    {points.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Réseau *</label>
                <select name="reseau_id" required className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Choisir un réseau</option>
                  {reseaux.map(r => <option key={r.id} value={r.id}>{r.nom}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Montant (FCFA) *</label>
                <input
                  name="montant"
                  type="number"
                  min={1}
                  required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: 25000"
                />
              </div>

              {agent_id_fixe ? (
                <input type="hidden" name="agent_id" value={agent_id_fixe} />
              ) : (
                agents.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Agent</label>
                    <select name="agent_id" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">— Sélectionner —</option>
                      {agents.map(a => <option key={a.id} value={a.id}>{a.nom_complet}</option>)}
                    </select>
                  </div>
                )
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                <input
                  name="note"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optionnel"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={pending || offlineQueued}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors ${
                    !isOnline
                      ? 'bg-amber-500 hover:bg-amber-600 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {pending        ? 'Enregistrement...'
                   : offlineQueued ? 'Sauvegardé !'
                   : !isOnline     ? 'Sauvegarder hors ligne'
                   : 'Enregistrer'}
                </button>
              </div>

              {!isOnline && (
                <p className="text-xs text-amber-600 text-center -mt-1">
                  La transaction sera envoyée automatiquement à la reconnexion
                </p>
              )}
            </form>
          </div>
        </div>
      )}
    </>
  )
}
