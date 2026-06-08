'use client'

import { useState, useActionState, useTransition, useEffect } from 'react'
import { ajouterDepense, supprimerDepense } from '@/lib/actions/depenses'
import { COMPTES_CHARGES, COMPTES_TRESORERIE, MODES_PAIEMENT } from '@/lib/comptabilite'
import { formatMontant } from '@/lib/utils'
import { Plus, Trash2, X, Loader2 } from 'lucide-react'
import { format } from 'date-fns'

interface Depense {
  id: string
  date_depense: string
  libelle: string
  montant: number
  compte_code: string
  compte_libelle: string
  compte_contrepartie: string
  libelle_contrepartie: string
  mode_paiement: string
  note: string | null
  point_de_vente_id: string | null
  points_de_vente: { nom: string } | null
}

const GROUPES = [...new Set(COMPTES_CHARGES.map(c => c.groupe))]

export default function DepensesClient({
  depenses,
  points,
  debut,
  fin,
}: {
  depenses: Depense[]
  points: Array<{ id: string; nom: string }>
  debut: string
  fin: string
}) {
  const [showForm, setShowForm] = useState(false)
  const [compteCode, setCompteCode] = useState<string>(COMPTES_CHARGES[0].code)
  const [contrepartie, setContrepartie] = useState<string>(COMPTES_TRESORERIE[0].code)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [addState, addAction] = useActionState(ajouterDepense, {})
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (addState.success) setShowForm(false)
  }, [addState.success])

  const selectedCompte       = COMPTES_CHARGES.find(c => c.code === compteCode)
  const selectedContrepartie = COMPTES_TRESORERIE.find(c => c.code === contrepartie)

  const total = depenses.reduce((s, d) => s + d.montant, 0)

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    await supprimerDepense(id)
    setDeletingId(null)
  }

  const handleSubmit = (fd: FormData) => {
    fd.set('compte_code', compteCode)
    fd.set('compte_libelle', selectedCompte?.libelle ?? '')
    fd.set('compte_contrepartie', contrepartie)
    fd.set('libelle_contrepartie', selectedContrepartie?.libelle ?? '')
    startTransition(() => { addAction(fd) })
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dépenses</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Charges d'exploitation — SYSCOHADA Classe 6 · {debut} → {fin}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouvelle dépense
        </button>
      </div>

      {/* Résumé */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span>{depenses.length} dépense(s)</span>
        <span>·</span>
        <span>Total : <span className="font-semibold text-red-600">{formatMontant(total)}</span></span>
      </div>

      {/* Liste */}
      {depenses.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
          <p className="text-gray-400 text-sm">Aucune dépense sur la période sélectionnée</p>
          <button onClick={() => setShowForm(true)} className="mt-3 text-blue-600 text-sm hover:underline">
            Enregistrer une dépense
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-5 py-3 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wide">
            <div className="col-span-2">Date</div>
            <div className="col-span-3">Libellé</div>
            <div className="col-span-3">Compte SYSCOHADA</div>
            <div className="col-span-2">Contrepartie</div>
            <div className="col-span-1 text-right">Montant</div>
            <div className="col-span-1" />
          </div>
          <div className="divide-y divide-gray-100">
            {depenses.map(d => (
              <div key={d.id} className="grid grid-cols-12 gap-2 px-5 py-3.5 items-center hover:bg-gray-50">
                <div className="col-span-2 text-sm text-gray-600">{d.date_depense}</div>
                <div className="col-span-3">
                  <p className="text-sm font-medium text-gray-900 truncate">{d.libelle}</p>
                  {d.points_de_vente && (
                    <p className="text-xs text-gray-400 truncate">{(d.points_de_vente as { nom: string }).nom}</p>
                  )}
                </div>
                <div className="col-span-3">
                  <span className="inline-flex items-center gap-1">
                    <span className="text-xs font-mono bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">{d.compte_code}</span>
                    <span className="text-xs text-gray-500 truncate">{d.compte_libelle}</span>
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-xs font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{d.compte_contrepartie}</span>
                  <span className="text-xs text-gray-400 ml-1">{d.libelle_contrepartie}</span>
                </div>
                <div className="col-span-1 text-right">
                  <span className="text-sm font-semibold text-red-600">{formatMontant(d.montant)}</span>
                </div>
                <div className="col-span-1 flex justify-end">
                  <button
                    onClick={() => handleDelete(d.id)}
                    disabled={deletingId === d.id}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {deletingId === d.id
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Trash2 className="w-4 h-4" />
                    }
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end px-5 py-3 border-t border-gray-200 bg-gray-50">
            <span className="text-sm font-bold text-gray-900">
              Total : <span className="text-red-600">{formatMontant(total)}</span>
            </span>
          </div>
        </div>
      )}

      {/* Modal formulaire */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Nouvelle dépense</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form action={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Date *</label>
                  <input
                    type="date"
                    name="date_depense"
                    defaultValue={format(new Date(), 'yyyy-MM-dd')}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Montant (FCFA) *</label>
                  <input
                    type="number"
                    name="montant"
                    placeholder="0"
                    min={1}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Libellé *</label>
                <input
                  type="text"
                  name="libelle"
                  placeholder="Description de la dépense"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Compte de charge (SYSCOHADA) *</label>
                <select
                  value={compteCode}
                  onChange={e => setCompteCode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {GROUPES.map(groupe => (
                    <optgroup key={groupe} label={groupe}>
                      {COMPTES_CHARGES.filter(c => c.groupe === groupe).map(c => (
                        <option key={c.code} value={c.code}>{c.code} — {c.libelle}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Payé par (contrepartie)</label>
                  <select
                    value={contrepartie}
                    onChange={e => setContrepartie(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {COMPTES_TRESORERIE.map(c => (
                      <option key={c.code} value={c.code}>{c.code} — {c.libelle}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Mode de paiement</label>
                  <select
                    name="mode_paiement"
                    defaultValue="ESPECES"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {MODES_PAIEMENT.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {points.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Point de vente</label>
                  <select
                    name="point_de_vente_id"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">— Général —</option>
                    {points.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Note (facultatif)</label>
                <textarea
                  name="note"
                  rows={2}
                  placeholder="Informations supplémentaires..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {addState.error && <p className="text-sm text-red-600">{addState.error}</p>}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  Annuler
                </button>
                <button type="submit" disabled={isPending}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
