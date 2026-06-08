'use client'

import { useActionState, useState, useEffect } from 'react'
import { ajusterCaisseInitiale } from '@/lib/actions/points'
import { formatMontant } from '@/lib/utils'
import {
  Wallet, TrendingUp, TrendingDown, Pencil, X, Check,
  Loader2, ArrowDownCircle, ArrowUpCircle, Info,
} from 'lucide-react'

interface Props {
  pointId: string
  caisseInitiale: number
  totalCashIn: number       // Σ dépôts (all-time)
  totalCashOut: number      // Σ retraits (all-time)
  depensesEspeces: number   // Σ dépenses payées en espèces
  variationJour: number     // dépôts_du_jour - retraits_du_jour
  estProprietaire: boolean
}

export default function CaisseCard({
  pointId,
  caisseInitiale,
  totalCashIn,
  totalCashOut,
  depensesEspeces,
  variationJour,
  estProprietaire,
}: Props) {
  const [editing, setEditing]   = useState(false)
  const [state, action, pending] = useActionState(ajusterCaisseInitiale, {})

  useEffect(() => {
    if (state.success) setEditing(false)
  }, [state.success])

  const soldeCaisse = caisseInitiale + totalCashIn - totalCashOut - depensesEspeces
  const totalSorties = totalCashOut + depensesEspeces

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">

      {/* ── En-tête ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-100 rounded-lg">
            <Wallet className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">Caisse physique</p>
            <p className="text-xs text-gray-400">Cash disponible en espèces</p>
          </div>
        </div>
        {estProprietaire && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Pencil className="w-3 h-3" />
            Ajuster
          </button>
        )}
      </div>

      <div className="px-5 py-5 space-y-4">

        {/* ── Solde principal ───────────────────────────────────────────── */}
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Solde actuel</p>
          <p className={`text-3xl font-bold tabular-nums ${
            soldeCaisse < 0 ? 'text-red-600' : 'text-gray-900'
          }`}>
            {formatMontant(soldeCaisse)}
          </p>
          {soldeCaisse < 0 && (
            <div className="flex items-center gap-1.5 mt-1">
              <Info className="w-3.5 h-3.5 text-red-500 shrink-0" />
              <p className="text-xs text-red-600">Solde négatif — vérifiez les retraits ou ajustez le fond initial</p>
            </div>
          )}
        </div>

        {/* ── Entrées / Sorties ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-50 border border-green-100 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <ArrowDownCircle className="w-4 h-4 text-green-600" />
              <span className="text-xs font-semibold text-green-700">Entrées cash</span>
            </div>
            <p className="text-lg font-bold text-green-700 tabular-nums">
              +{formatMontant(totalCashIn)}
            </p>
            <p className="text-xs text-green-600 mt-0.5">
              {/* Pas de format pour le nombre de transactions ici */}
              Tous les dépôts
            </p>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <ArrowUpCircle className="w-4 h-4 text-red-600" />
              <span className="text-xs font-semibold text-red-700">Sorties cash</span>
            </div>
            <p className="text-lg font-bold text-red-700 tabular-nums">
              -{formatMontant(totalSorties)}
            </p>
            {depensesEspeces > 0 && (
              <p className="text-xs text-red-500 mt-0.5">
                dont {formatMontant(depensesEspeces)} dépenses
              </p>
            )}
          </div>
        </div>

        {/* ── Détail du calcul ──────────────────────────────────────────── */}
        <div className="bg-gray-50 rounded-xl p-3 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Détail</p>
          <div className="space-y-1.5">
            <Row label="Fond de caisse initial" value={formatMontant(caisseInitiale)} neutral />
            <Row label="+ Dépôts (cash reçu)" value={`+${formatMontant(totalCashIn)}`} positive />
            <Row label="− Retraits (cash versé)" value={`-${formatMontant(totalCashOut)}`} negative />
            {depensesEspeces > 0 && (
              <Row label="− Dépenses en espèces" value={`-${formatMontant(depensesEspeces)}`} negative />
            )}
            <div className="border-t border-gray-200 pt-1.5 mt-1.5">
              <Row
                label="= Solde de caisse"
                value={formatMontant(soldeCaisse)}
                positive={soldeCaisse >= 0}
                negative={soldeCaisse < 0}
                bold
              />
            </div>
          </div>
        </div>

        {/* ── Variation du jour ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between py-2.5 px-3 rounded-xl border border-gray-100 bg-white">
          <div className="flex items-center gap-2">
            {variationJour >= 0
              ? <TrendingUp className="w-4 h-4 text-green-500" />
              : <TrendingDown className="w-4 h-4 text-red-500" />
            }
            <span className="text-sm text-gray-600">Variation aujourd'hui</span>
          </div>
          <span className={`text-sm font-bold tabular-nums ${variationJour >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {variationJour >= 0 ? '+' : ''}{formatMontant(variationJour)}
          </span>
        </div>

        {/* ── Formulaire ajustement fond initial ───────────────────────── */}
        {editing && estProprietaire && (
          <div className="border border-blue-200 rounded-xl p-4 bg-blue-50">
            <p className="text-xs font-semibold text-blue-800 mb-3">
              Ajuster le fond de caisse initial
            </p>
            <p className="text-xs text-blue-600 mb-3">
              Ce montant représente l'argent physique présent dans la caisse au départ (avant toute transaction enregistrée dans le système).
            </p>
            {state.error && (
              <p className="text-xs text-red-600 mb-2">{state.error}</p>
            )}
            <form action={action} className="space-y-3">
              <input type="hidden" name="point_id" value={pointId} />
              <div>
                <label className="block text-xs font-medium text-blue-800 mb-1">
                  Fond initial (FCFA)
                </label>
                <input
                  name="caisse_initiale"
                  type="number"
                  min={0}
                  step={1000}
                  defaultValue={caisseInitiale}
                  required
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  placeholder="0"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="flex items-center gap-1 flex-1 justify-center py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-white transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="flex items-center gap-1 flex-1 justify-center py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {pending
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Check className="w-3.5 h-3.5" />
                  }
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  )
}

function Row({
  label, value, positive, negative, neutral, bold,
}: {
  label: string; value: string
  positive?: boolean; negative?: boolean; neutral?: boolean; bold?: boolean
}) {
  const color = positive ? 'text-green-700' : negative ? 'text-red-600' : 'text-gray-700'
  return (
    <div className="flex items-center justify-between">
      <span className={`text-xs ${bold ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>{label}</span>
      <span className={`text-xs tabular-nums ${bold ? 'font-bold text-sm' : 'font-medium'} ${color}`}>{value}</span>
    </div>
  )
}
