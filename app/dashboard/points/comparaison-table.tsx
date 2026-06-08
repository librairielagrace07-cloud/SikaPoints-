'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  ChevronUp, ChevronDown, ChevronsUpDown,
  Store, AlertTriangle, TrendingUp, TrendingDown,
  Wallet, Users, ArrowDownCircle, ArrowUpCircle,
} from 'lucide-react'
import { formatMontant } from '@/lib/utils'
import type { PointStat } from './page'

type SortKey = 'nom' | 'agentsCount' | 'totalDepots' | 'totalRetraits' | 'volume' | 'soldeCaisse' | 'uvTotal' | 'uvFaibles'
type SortDir = 'asc' | 'desc'

const COLUMNS: { key: SortKey; label: string; icon: React.ReactNode; align: 'left' | 'right' }[] = [
  { key: 'nom',          label: 'Point',         icon: <Store className="w-3.5 h-3.5" />,           align: 'left'  },
  { key: 'agentsCount',  label: 'Agents',        icon: <Users className="w-3.5 h-3.5" />,           align: 'right' },
  { key: 'totalDepots',  label: 'Dépôts',        icon: <ArrowDownCircle className="w-3.5 h-3.5" />, align: 'right' },
  { key: 'totalRetraits',label: 'Retraits',      icon: <ArrowUpCircle className="w-3.5 h-3.5" />,   align: 'right' },
  { key: 'volume',       label: 'Volume total',  icon: <TrendingUp className="w-3.5 h-3.5" />,      align: 'right' },
  { key: 'soldeCaisse',  label: 'Caisse',        icon: <Wallet className="w-3.5 h-3.5" />,          align: 'right' },
  { key: 'uvTotal',      label: 'UV disponible', icon: <TrendingUp className="w-3.5 h-3.5" />,      align: 'right' },
  { key: 'uvFaibles',    label: 'UV ⚠',          icon: <AlertTriangle className="w-3.5 h-3.5" />,   align: 'right' },
]

export default function ComparaisonTable({ stats }: { stats: PointStat[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('volume')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const sorted = useMemo(() => {
    return [...stats].sort((a, b) => {
      const va = sortKey === 'volume' ? a.totalDepots + a.totalRetraits
               : sortKey === 'nom'    ? a.nom.localeCompare(b.nom)
               : (a[sortKey] as number)
      const vb = sortKey === 'volume' ? b.totalDepots + b.totalRetraits
               : sortKey === 'nom'    ? b.nom.localeCompare(a.nom)
               : (b[sortKey] as number)
      if (sortKey === 'nom') return sortDir === 'asc' ? (va as number) : -(va as number)
      return sortDir === 'desc' ? (vb as number) - (va as number) : (va as number) - (vb as number)
    })
  }, [stats, sortKey, sortDir])

  // Valeurs max pour les barres de progression
  const maxDepots   = Math.max(...stats.map(s => s.totalDepots),   1)
  const maxRetraits = Math.max(...stats.map(s => s.totalRetraits), 1)
  const maxVolume   = Math.max(...stats.map(s => s.totalDepots + s.totalRetraits), 1)
  const maxCaisse   = Math.max(...stats.map(s => Math.abs(s.soldeCaisse)), 1)
  const maxUV       = Math.max(...stats.map(s => s.uvTotal), 1)

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  if (stats.length === 0) return null

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Légende */}
      <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-4 text-xs text-gray-500 flex-wrap">
        <span className="font-semibold text-gray-700">Comparaison des performances</span>
        <span>·</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full inline-block" /> Dépôts = cash entrant</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-orange-400 rounded-full inline-block" /> Retraits = cash sortant</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-500 rounded-full inline-block" /> Volume = activité totale</span>
        <span className="ml-auto italic">Cliquez sur un en-tête pour trier</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="border-b border-gray-200">
              {/* Rang */}
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide w-12">#</th>
              {COLUMNS.map(col => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer select-none hover:bg-gray-50 transition-colors ${col.align === 'right' ? 'text-right' : 'text-left'}`}
                  onClick={() => handleSort(col.key)}
                >
                  <div className={`flex items-center gap-1.5 ${col.align === 'right' ? 'justify-end' : ''}`}>
                    <span className={sortKey === col.key ? 'text-blue-600' : 'text-gray-400'}>{col.icon}</span>
                    <span className={sortKey === col.key ? 'text-blue-700' : ''}>{col.label}</span>
                    <SortIcon active={sortKey === col.key} dir={sortDir} />
                  </div>
                </th>
              ))}
              {/* Lien */}
              <th className="px-4 py-3 w-16" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sorted.map((s, idx) => {
              const volume      = s.totalDepots + s.totalRetraits
              const pctDepot    = (s.totalDepots   / maxDepots)   * 100
              const pctRetrait  = (s.totalRetraits / maxRetraits) * 100
              const pctVolume   = (volume          / maxVolume)   * 100
              const pctCaisse   = (Math.abs(s.soldeCaisse) / maxCaisse) * 100
              const pctUV       = (s.uvTotal / maxUV) * 100
              const rang        = idx + 1

              return (
                <tr key={s.id} className={`hover:bg-blue-50/30 transition-colors ${rang === 1 ? 'bg-amber-50/40' : ''}`}>
                  {/* Rang */}
                  <td className="px-4 py-4">
                    <RangBadge rang={rang} />
                  </td>

                  {/* Nom */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                        <Store className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 leading-tight">{s.nom}</p>
                        {s.adresse && <p className="text-xs text-gray-400 truncate max-w-[160px]">{s.adresse}</p>}
                      </div>
                    </div>
                  </td>

                  {/* Agents */}
                  <td className="px-4 py-4 text-right">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
                      <Users className="w-3 h-3" />
                      {s.agentsCount}
                    </span>
                  </td>

                  {/* Dépôts */}
                  <td className="px-4 py-4">
                    <div className="text-right">
                      <p className="font-semibold text-green-700 tabular-nums">{formatMontant(s.totalDepots)}</p>
                      <div className="mt-1 h-1 bg-gray-100 rounded-full overflow-hidden w-24 ml-auto">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: `${pctDepot}%` }} />
                      </div>
                    </div>
                  </td>

                  {/* Retraits */}
                  <td className="px-4 py-4">
                    <div className="text-right">
                      <p className="font-semibold text-orange-600 tabular-nums">{formatMontant(s.totalRetraits)}</p>
                      <div className="mt-1 h-1 bg-gray-100 rounded-full overflow-hidden w-24 ml-auto">
                        <div className="h-full bg-orange-400 rounded-full" style={{ width: `${pctRetrait}%` }} />
                      </div>
                    </div>
                  </td>

                  {/* Volume total */}
                  <td className="px-4 py-4">
                    <div className="text-right">
                      <p className="font-bold text-gray-900 tabular-nums">{formatMontant(volume)}</p>
                      <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden w-24 ml-auto">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pctVolume}%` }} />
                      </div>
                    </div>
                  </td>

                  {/* Caisse */}
                  <td className="px-4 py-4">
                    <div className="text-right">
                      <p className={`font-semibold tabular-nums ${s.soldeCaisse < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                        {formatMontant(s.soldeCaisse)}
                      </p>
                      <div className="mt-1 h-1 bg-gray-100 rounded-full overflow-hidden w-24 ml-auto">
                        <div
                          className={`h-full rounded-full ${s.soldeCaisse < 0 ? 'bg-red-400' : 'bg-blue-400'}`}
                          style={{ width: `${pctCaisse}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* UV total */}
                  <td className="px-4 py-4">
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 tabular-nums">{formatMontant(s.uvTotal)}</p>
                      <div className="mt-1 flex flex-wrap gap-1 justify-end">
                        {s.uvList.slice(0, 4).map((u, i) => (
                          <div
                            key={i}
                            title={`${u.nom}: ${formatMontant(u.montant)}`}
                            className="w-3 h-3 rounded-sm"
                            style={{
                              backgroundColor: u.couleur,
                              opacity: u.montant <= u.seuil_alerte ? 0.35 : 1,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </td>

                  {/* UV faibles */}
                  <td className="px-4 py-4 text-right">
                    {s.uvFaibles > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
                        <AlertTriangle className="w-3 h-3" />
                        {s.uvFaibles}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                        OK
                      </span>
                    )}
                  </td>

                  {/* Lien */}
                  <td className="px-4 py-4">
                    <Link
                      href={`/dashboard/points/${s.id}`}
                      className="text-xs text-blue-600 hover:underline font-medium whitespace-nowrap"
                    >
                      Voir →
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>

          {/* Totaux */}
          <tfoot>
            <tr className="border-t-2 border-gray-200 bg-gray-50">
              <td className="px-4 py-3" />
              <td className="px-4 py-3">
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">TOTAUX</span>
              </td>
              <td className="px-4 py-3 text-right">
                <span className="text-xs font-bold text-gray-700">{stats.reduce((s, p) => s + p.agentsCount, 0)}</span>
              </td>
              <td className="px-4 py-3 text-right">
                <span className="text-sm font-bold text-green-700 tabular-nums">
                  {formatMontant(stats.reduce((s, p) => s + p.totalDepots, 0))}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <span className="text-sm font-bold text-orange-600 tabular-nums">
                  {formatMontant(stats.reduce((s, p) => s + p.totalRetraits, 0))}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <span className="text-sm font-bold text-gray-900 tabular-nums">
                  {formatMontant(stats.reduce((s, p) => s + p.totalDepots + p.totalRetraits, 0))}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <span className="text-sm font-bold text-gray-900 tabular-nums">
                  {formatMontant(stats.reduce((s, p) => s + p.soldeCaisse, 0))}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <span className="text-sm font-bold text-gray-900 tabular-nums">
                  {formatMontant(stats.reduce((s, p) => s + p.uvTotal, 0))}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <span className={`text-xs font-bold ${stats.some(p => p.uvFaibles > 0) ? 'text-red-600' : 'text-green-600'}`}>
                  {stats.reduce((s, p) => s + p.uvFaibles, 0) || 'Tout OK'}
                </span>
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

function RangBadge({ rang }: { rang: number }) {
  if (rang === 1) return (
    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">🥇</span>
  )
  if (rang === 2) return (
    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-gray-600 text-xs font-bold">🥈</span>
  )
  if (rang === 3) return (
    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-orange-50 text-orange-700 text-xs font-bold">🥉</span>
  )
  return (
    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-50 text-gray-400 text-xs font-semibold">
      {rang}
    </span>
  )
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ChevronsUpDown className="w-3 h-3 text-gray-300" />
  return dir === 'desc'
    ? <ChevronDown className="w-3 h-3 text-blue-600" />
    : <ChevronUp   className="w-3 h-3 text-blue-600" />
}
