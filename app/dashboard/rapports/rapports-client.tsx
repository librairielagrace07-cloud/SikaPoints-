'use client'

import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend,
} from 'recharts'
import { formatMontant } from '@/lib/utils'
import {
  format, startOfDay, startOfWeek, startOfMonth, parseISO,
  eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval,
  subDays, subMonths, isWithinInterval, endOfDay,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import { FileDown, FileSpreadsheet, CalendarDays, Loader2, Store, Lock } from 'lucide-react'
import { getLimits } from '@/lib/plan-limits'
import Link from 'next/link'

type Periode = 'jour' | 'semaine' | 'mois'
type QuickRange = '7j' | '30j' | '3m' | '6m' | '12m' | 'custom'

interface Transaction {
  type: 'RETRAIT' | 'DEPOT'
  montant: number
  reseau_id: string
  point_de_vente_id: string
  created_at: string
  reseaux: { nom: string; couleur: string }
  points_de_vente: { nom: string }
}
interface Reseau  { id: string; nom: string; couleur: string }
interface Point   { id: string; nom: string }

// ── Groupement graphique ───────────────────────────────────────────────────────
function groupByPeriode(transactions: Transaction[], periode: Periode, debut: Date, fin: Date) {
  const groupFn = periode === 'jour'
    ? (d: Date) => format(startOfDay(d),                       'yyyy-MM-dd')
    : periode === 'semaine'
    ? (d: Date) => format(startOfWeek(d, { locale: fr }),      'yyyy-MM-dd')
    : (d: Date) => format(startOfMonth(d),                     'yyyy-MM')

  const labelFn = periode === 'jour'
    ? (k: string) => format(parseISO(k),          'dd/MM',         { locale: fr })
    : periode === 'semaine'
    ? (k: string) => `S.${format(parseISO(k),     'w',             { locale: fr })}`
    : (k: string) => format(parseISO(k + '-01'),  'MMM yy',        { locale: fr })

  const map: Record<string, { depots: number; retraits: number }> = {}

  if (periode === 'jour') {
    eachDayOfInterval({ start: debut, end: fin }).forEach(d => { map[groupFn(d)] = { depots: 0, retraits: 0 } })
  } else if (periode === 'semaine') {
    eachWeekOfInterval({ start: debut, end: fin }, { locale: fr }).forEach(d => { map[groupFn(d)] = { depots: 0, retraits: 0 } })
  } else {
    eachMonthOfInterval({ start: debut, end: fin }).forEach(d => { map[groupFn(d)] = { depots: 0, retraits: 0 } })
  }

  transactions.forEach(t => {
    const key = groupFn(parseISO(t.created_at))
    if (!map[key]) map[key] = { depots: 0, retraits: 0 }
    if (t.type === 'DEPOT') map[key].depots += t.montant
    else                    map[key].retraits += t.montant
  })

  return Object.entries(map).map(([key, val]) => ({
    label: labelFn(key),
    Dépôts: val.depots,
    Retraits: val.retraits,
  }))
}

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string
}) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-sm">
      <p className="font-medium text-gray-800 mb-1.5">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-xs" style={{ color: p.color }}>{p.name} : {formatMontant(p.value)}</p>
      ))}
    </div>
  )
}

// ── Composant principal ────────────────────────────────────────────────────────
export default function RapportsClient({
  transactions,
  reseaux,
  points,
  plan,
}: {
  transactions: Transaction[]
  reseaux: Reseau[]
  points: Point[]
  plan: string
}) {
  const planLimits = getLimits(plan)
  const peutExporter = planLimits.exportsPDF || planLimits.exportsExcel
  const [periode,         setPeriode]         = useState<Periode>('jour')
  const [quickRange,      setQuickRange]      = useState<QuickRange>('30j')
  const [dateDebut,       setDateDebut]       = useState(() => format(subDays(new Date(), 29), 'yyyy-MM-dd'))
  const [dateFin,         setDateFin]         = useState(() => format(new Date(), 'yyyy-MM-dd'))
  const [exporting,       setExporting]       = useState<'pdf' | 'excel' | null>(null)
  const [selectedPointId, setSelectedPointId] = useState(() => points[0]?.id ?? '')
  const [exportingPoint,  setExportingPoint]  = useState<'pdf' | 'excel' | null>(null)

  // ── Plage active ───────────────────────────────────────────────────────────
  // fin = endOfDay pour inclure toutes les transactions du jour courant
  const { debut, fin } = useMemo(() => {
    const now    = new Date()
    const finDay = endOfDay(now)
    if (quickRange === 'custom') {
      return { debut: new Date(dateDebut + 'T00:00:00'), fin: new Date(dateFin + 'T23:59:59') }
    }
    const map: Record<QuickRange, () => { debut: Date; fin: Date }> = {
      '7j':  () => ({ debut: startOfDay(subDays(now, 6)),    fin: finDay }),
      '30j': () => ({ debut: startOfDay(subDays(now, 29)),   fin: finDay }),
      '3m':  () => ({ debut: startOfDay(subMonths(now, 3)),  fin: finDay }),
      '6m':  () => ({ debut: startOfDay(subMonths(now, 6)),  fin: finDay }),
      '12m': () => ({ debut: startOfDay(subMonths(now, 12)), fin: finDay }),
      custom: () => ({ debut: finDay, fin: finDay }),
    }
    return map[quickRange]()
  }, [quickRange, dateDebut, dateFin])

  // ── Transactions filtrées ──────────────────────────────────────────────────
  const filtered = useMemo(() =>
    transactions.filter(t => {
      const d = parseISO(t.created_at)
      return isWithinInterval(d, { start: debut, end: fin })
    }),
  [transactions, debut, fin])

  const totalDepots   = filtered.filter(t => t.type === 'DEPOT').reduce((s, t) => s + t.montant, 0)
  const totalRetraits = filtered.filter(t => t.type === 'RETRAIT').reduce((s, t) => s + t.montant, 0)

  const chartData = useMemo(() => groupByPeriode(filtered, periode, debut, fin), [filtered, periode, debut, fin])

  const parReseau = useMemo(() => {
    const map: Record<string, { depots: number; retraits: number; nb: number; reseau: Reseau }> = {}
    filtered.forEach(t => {
      const r = reseaux.find(r => r.id === t.reseau_id)
      if (!r) return
      if (!map[t.reseau_id]) map[t.reseau_id] = { depots: 0, retraits: 0, nb: 0, reseau: r }
      if (t.type === 'DEPOT') map[t.reseau_id].depots += t.montant
      else                    map[t.reseau_id].retraits += t.montant
      map[t.reseau_id].nb++
    })
    return Object.values(map).sort((a, b) => (b.depots + b.retraits) - (a.depots + a.retraits))
  }, [filtered, reseaux])

  /** Synthèse par point de vente, pour le rapport global */
  const parPoint = useMemo(() => {
    const map: Record<string, {
      id: string; nom: string; depots: number; retraits: number; nb: number
      reseaux: Record<string, { depots: number; retraits: number; nb: number; reseau: Reseau }>
    }> = {}
    filtered.forEach(t => {
      const pt = points.find(p => p.id === t.point_de_vente_id)
      if (!pt) return
      if (!map[pt.id]) map[pt.id] = { id: pt.id, nom: pt.nom, depots: 0, retraits: 0, nb: 0, reseaux: {} }
      if (t.type === 'DEPOT') map[pt.id].depots += t.montant
      else                    map[pt.id].retraits += t.montant
      map[pt.id].nb++
      const r = reseaux.find(r => r.id === t.reseau_id)
      if (r) {
        if (!map[pt.id].reseaux[r.id]) map[pt.id].reseaux[r.id] = { depots: 0, retraits: 0, nb: 0, reseau: r }
        if (t.type === 'DEPOT') map[pt.id].reseaux[r.id].depots += t.montant
        else                    map[pt.id].reseaux[r.id].retraits += t.montant
        map[pt.id].reseaux[r.id].nb++
      }
    })
    return Object.values(map)
      .sort((a, b) => (b.depots + b.retraits) - (a.depots + a.retraits))
      .map(pt => ({
        id: pt.id,
        nom: pt.nom,
        depots: pt.depots,
        retraits: pt.retraits,
        nb: pt.nb,
        parReseau: Object.values(pt.reseaux)
          .sort((a, b) => (b.depots + b.retraits) - (a.depots + a.retraits))
          .map(r => ({ nom: r.reseau.nom, couleur: r.reseau.couleur, depots: r.depots, retraits: r.retraits, nb: r.nb })),
      }))
  }, [filtered, points, reseaux])

  // ── Données export par point ──────────────────────────────────────────────
  const pointRapportData = useMemo(() => {
    const selectedPoint = points.find(p => p.id === selectedPointId)
    if (!selectedPoint) return null

    const ptFiltered = filtered.filter(t => t.point_de_vente_id === selectedPointId)
    const ptDepots   = ptFiltered.filter(t => t.type === 'DEPOT').reduce((s, t)   => s + t.montant, 0)
    const ptRetraits = ptFiltered.filter(t => t.type === 'RETRAIT').reduce((s, t) => s + t.montant, 0)

    const reseauMap: Record<string, { depots: number; retraits: number; nb: number; reseau: Reseau }> = {}
    ptFiltered.forEach(t => {
      const r = reseaux.find(r => r.id === t.reseau_id)
      if (!r) return
      if (!reseauMap[t.reseau_id]) reseauMap[t.reseau_id] = { depots: 0, retraits: 0, nb: 0, reseau: r }
      if (t.type === 'DEPOT') reseauMap[t.reseau_id].depots += t.montant
      else                    reseauMap[t.reseau_id].retraits += t.montant
      reseauMap[t.reseau_id].nb++
    })

    return {
      dateDebut: debut,
      dateFin: fin,
      periodeLabel: quickRange === 'custom' ? `${dateDebut} – ${dateFin}` : ({ '7j': '7 derniers jours', '30j': '30 derniers jours', '3m': '3 derniers mois', '6m': '6 derniers mois', '12m': '12 derniers mois', custom: '' } as Record<QuickRange, string>)[quickRange],
      points: [selectedPoint],
      totalDepots: ptDepots,
      totalRetraits: ptRetraits,
      nbTransactions: ptFiltered.length,
      parReseau: Object.values(reseauMap)
        .sort((a, b) => (b.depots + b.retraits) - (a.depots + a.retraits))
        .map(r => ({ nom: r.reseau.nom, couleur: r.reseau.couleur, depots: r.depots, retraits: r.retraits, nb: r.nb })),
      transactions: ptFiltered.map(t => ({
        date: t.created_at,
        type: t.type,
        reseau: (t.reseaux as { nom: string }).nom,
        montant: t.montant,
        point: (t.points_de_vente as { nom: string })?.nom ?? '—',
      })),
      nomPoint: selectedPoint.nom,
    }
  }, [selectedPointId, points, filtered, debut, fin, quickRange, dateDebut, dateFin, reseaux])

  // ── Données pour l'export ──────────────────────────────────────────────────
  const rapportData = useMemo(() => ({
    dateDebut: debut,
    dateFin: fin,
    periodeLabel: quickRange === 'custom'
      ? `${dateDebut} – ${dateFin}`
      : ({ '7j': '7 derniers jours', '30j': '30 derniers jours', '3m': '3 derniers mois', '6m': '6 derniers mois', '12m': '12 derniers mois', custom: '' } as Record<QuickRange, string>)[quickRange],
    points,
    totalDepots,
    totalRetraits,
    nbTransactions: filtered.length,
    parReseau: parReseau.map(r => ({ nom: r.reseau.nom, couleur: r.reseau.couleur, depots: r.depots, retraits: r.retraits, nb: r.nb })),
    parPoint,
    transactions: filtered.map(t => ({
      date: t.created_at,
      type: t.type,
      reseau: (t.reseaux as { nom: string }).nom,
      montant: t.montant,
      point: (t.points_de_vente as { nom: string })?.nom ?? '—',
    })),
  }), [debut, fin, quickRange, dateDebut, dateFin, points, totalDepots, totalRetraits, filtered, parReseau, parPoint])

  const handleExportPDF = async () => {
    setExporting('pdf')
    try {
      const { generatePDF } = await import('@/lib/export/pdf')
      generatePDF(rapportData)
    } finally { setExporting(null) }
  }

  const handleExportExcel = async () => {
    setExporting('excel')
    try {
      const { generateExcel } = await import('@/lib/export/excel')
      generateExcel(rapportData)
    } finally { setExporting(null) }
  }

  const handlePointPDF = async () => {
    if (!pointRapportData) return
    setExportingPoint('pdf')
    try {
      const { generatePDF } = await import('@/lib/export/pdf')
      generatePDF(pointRapportData)
    } finally { setExportingPoint(null) }
  }

  const handlePointExcel = async () => {
    if (!pointRapportData) return
    setExportingPoint('excel')
    try {
      const { generateExcel } = await import('@/lib/export/excel')
      generateExcel(pointRapportData)
    } finally { setExportingPoint(null) }
  }

  // ── Quick range labels ─────────────────────────────────────────────────────
  const QUICK: Array<{ id: QuickRange; label: string }> = [
    { id: '7j',  label: '7 j' },
    { id: '30j', label: '30 j' },
    { id: '3m',  label: '3 mois' },
    { id: '6m',  label: '6 mois' },
    { id: '12m', label: '12 mois' },
    { id: 'custom', label: 'Personnalisé' },
  ]

  return (
    <div className="space-y-5">

      {/* ── Barre de contrôle ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          {/* Sélecteur de période rapide */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <CalendarDays className="w-4 h-4 text-gray-400 shrink-0" />
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg flex-wrap">
              {QUICK.map(q => (
                <button
                  key={q.id}
                  onClick={() => setQuickRange(q.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    quickRange === q.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>

          {/* Boutons export */}
          <div className="flex flex-col gap-1.5 items-end">
            {!peutExporter ? (
              <Link
                href="/dashboard/parametres?onglet=abonnement"
                className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-100 transition-colors"
              >
                <Lock className="w-3.5 h-3.5" />
                Exports PDF/Excel — plan Solo requis
              </Link>
            ) : (
              <>
                {/* Export global */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 font-medium">Rapport global</span>
                  <button
                    onClick={handleExportExcel}
                    disabled={exporting !== null || filtered.length === 0}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-green-200 text-green-700 rounded-lg text-sm font-medium hover:bg-green-50 disabled:opacity-50 transition-colors"
                  >
                    {exporting === 'excel' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5" />}
                    Excel
                  </button>
                  <button
                    onClick={handleExportPDF}
                    disabled={exporting !== null || filtered.length === 0}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {exporting === 'pdf' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
                    PDF
                  </button>
                </div>

                {/* Export par point */}
                {points.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    <span className="text-xs text-gray-400 font-medium">Par point</span>
                    <div className="flex items-center gap-1">
                      <Store className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <select
                        value={selectedPointId}
                        onChange={e => setSelectedPointId(e.target.value)}
                        className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white max-w-45"
                      >
                        {points.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
                      </select>
                    </div>
                    <button
                      onClick={handlePointExcel}
                      disabled={exportingPoint !== null || !pointRapportData || pointRapportData.nbTransactions === 0}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-green-200 text-green-700 rounded-lg text-sm font-medium hover:bg-green-50 disabled:opacity-50 transition-colors"
                    >
                      {exportingPoint === 'excel' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5" />}
                      Excel
                    </button>
                    <button
                      onClick={handlePointPDF}
                      disabled={exportingPoint !== null || !pointRapportData || pointRapportData.nbTransactions === 0}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {exportingPoint === 'pdf' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
                      PDF
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Plage personnalisée */}
        {quickRange === 'custom' && (
          <div className="flex items-center gap-3 flex-wrap pt-1 border-t border-gray-100">
            <span className="text-xs text-gray-500 font-medium">Du</span>
            <input
              type="date"
              value={dateDebut}
              max={dateFin}
              onChange={e => setDateDebut(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-xs text-gray-500 font-medium">au</span>
            <input
              type="date"
              value={dateFin}
              min={dateDebut}
              max={format(new Date(), 'yyyy-MM-dd')}
              onChange={e => setDateFin(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-xs text-gray-400 ml-1">
              {filtered.length} transaction(s)
            </span>
          </div>
        )}

        {quickRange !== 'custom' && (
          <p className="text-xs text-gray-400">
            {format(debut, 'dd MMM yyyy', { locale: fr })} → {format(fin, 'dd MMM yyyy', { locale: fr })} · {filtered.length} transaction(s)
          </p>
        )}
      </div>

      {/* ── Cartes résumé ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total dépôts',    val: formatMontant(totalDepots),               color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-100' },
          { label: 'Total retraits',  val: formatMontant(totalRetraits),             color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-100' },
          { label: 'Volume total',    val: formatMontant(totalDepots + totalRetraits), color: 'text-blue-600', bg: 'bg-blue-50',   border: 'border-blue-100' },
          { label: 'Transactions',    val: String(filtered.length),                  color: 'text-gray-900',   bg: 'bg-gray-50',   border: 'border-gray-200' },
        ].map(c => (
          <div key={c.label} className={`${c.bg} border ${c.border} rounded-xl p-4`}>
            <p className="text-xs text-gray-500 mb-1">{c.label}</p>
            <p className={`text-xl font-bold ${c.color}`}>{c.val}</p>
          </div>
        ))}
      </div>

      {/* ── Graphique ─────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="font-semibold text-gray-900">Évolution des transactions</h2>
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            {(['jour', 'semaine', 'mois'] as Periode[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriode(p)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  periode === p ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>
        {filtered.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v)} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Dépôts"   fill="#22c55e" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Retraits" fill="#f97316" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
            Aucune transaction sur cette période
          </div>
        )}
      </div>

      {/* ── Par réseau ────────────────────────────────────────────────────── */}
      {parReseau.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-900 mb-3">Par réseau</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {parReseau.map(({ reseau, depots, retraits, nb }) => {
              const vol = depots + retraits
              const totalVol = totalDepots + totalRetraits
              const pct = totalVol > 0 ? Math.round((vol / totalVol) * 100) : 0
              return (
                <div key={reseau.id} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: reseau.couleur }} />
                      <span className="font-semibold text-gray-900">{reseau.nom}</span>
                    </div>
                    <span className="text-xs text-gray-400">{nb} tx · {pct}%</span>
                  </div>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Dépôts</span>
                      <span className="font-semibold text-green-600">{formatMontant(depots)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Retraits</span>
                      <span className="font-semibold text-orange-500">{formatMontant(retraits)}</span>
                    </div>
                    <div className="border-t pt-1.5 flex justify-between font-bold">
                      <span className="text-gray-700">Volume</span>
                      <span className="text-gray-900">{formatMontant(vol)}</span>
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-blue-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Par point de vente ───────────────────────────────────────────── */}
      {parPoint.length > 1 && (
        <div>
          <h2 className="font-semibold text-gray-900 mb-3">Par point de vente</h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-indigo-600 text-white">
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide">Point de vente</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide">Dépôts</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide">Retraits</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide">Volume</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wide">Tx</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide">Part</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {parPoint.map((pt, i) => {
                  const vol = pt.depots + pt.retraits
                  const totalVol = totalDepots + totalRetraits
                  const pct = totalVol > 0 ? Math.round((vol / totalVol) * 100) : 0
                  return (
                    <tr key={pt.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                          <span className="font-medium text-gray-900">{pt.nom}</span>
                        </div>
                        {/* Détail mini par réseau */}
                        {pt.parReseau.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 pl-4">
                            {pt.parReseau.map(r => (
                              <span key={r.nom} className="text-xs text-gray-400 flex items-center gap-1">
                                <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: r.couleur }} />
                                {r.nom} {r.nb}tx
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-green-600 whitespace-nowrap">{formatMontant(pt.depots)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-orange-500 whitespace-nowrap">{formatMontant(pt.retraits)}</td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900 whitespace-nowrap">{formatMontant(vol)}</td>
                      <td className="px-4 py-3 text-center text-gray-600">{pt.nb}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden hidden sm:block">
                            <div className="h-full rounded-full bg-indigo-500" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-gray-500 font-medium">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-indigo-50 border-t-2 border-indigo-200">
                  <td className="px-4 py-3 font-bold text-indigo-700 text-sm">TOTAL</td>
                  <td className="px-4 py-3 text-right font-bold text-green-700 whitespace-nowrap">{formatMontant(totalDepots)}</td>
                  <td className="px-4 py-3 text-right font-bold text-orange-600 whitespace-nowrap">{formatMontant(totalRetraits)}</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900 whitespace-nowrap">{formatMontant(totalDepots + totalRetraits)}</td>
                  <td className="px-4 py-3 text-center font-bold text-gray-900">{filtered.length}</td>
                  <td className="px-4 py-3 text-right font-bold text-indigo-700">100%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
