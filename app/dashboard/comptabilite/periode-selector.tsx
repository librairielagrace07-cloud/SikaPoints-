'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { format, startOfMonth, subMonths, startOfYear } from 'date-fns'
import { CalendarDays, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

type Quick = '1m' | '3m' | '6m' | '12m' | 'ytd' | 'custom'

const RANGES: Array<{ id: Quick; label: string }> = [
  { id: '1m',    label: 'Ce mois' },
  { id: '3m',    label: '3 mois' },
  { id: '6m',    label: '6 mois' },
  { id: '12m',   label: '12 mois' },
  { id: 'ytd',   label: 'Cette année' },
  { id: 'custom', label: 'Personnalisé' },
]

function getDefaults(range: Quick): { debut: string; fin: string } {
  const now = new Date()
  const fin  = format(now, 'yyyy-MM-dd')
  switch (range) {
    case '1m':  return { debut: format(startOfMonth(now),            'yyyy-MM-dd'), fin }
    case '3m':  return { debut: format(startOfMonth(subMonths(now, 2)), 'yyyy-MM-dd'), fin }
    case '6m':  return { debut: format(startOfMonth(subMonths(now, 5)), 'yyyy-MM-dd'), fin }
    case '12m': return { debut: format(startOfMonth(subMonths(now, 11)),'yyyy-MM-dd'), fin }
    case 'ytd': return { debut: format(startOfYear(now),              'yyyy-MM-dd'), fin }
    default:    return { debut: format(startOfMonth(now),            'yyyy-MM-dd'), fin }
  }
}

export default function PeriodeSelector() {
  const router      = useRouter()
  const pathname    = usePathname()
  const searchParams = useSearchParams()

  const [quick,    setQuick]    = useState<Quick>('1m')
  const [debut,    setDebut]    = useState(() => searchParams.get('debut') ?? getDefaults('1m').debut)
  const [fin,      setFin]      = useState(() => searchParams.get('fin')   ?? getDefaults('1m').fin)
  const [showCustom, setShowCustom] = useState(false)

  const navigate = (d: string, f: string) => {
    const p = new URLSearchParams(searchParams.toString())
    p.set('debut', d)
    p.set('fin',   f)
    router.push(`${pathname}?${p.toString()}`)
  }

  const handleQuick = (range: Quick) => {
    setQuick(range)
    if (range === 'custom') { setShowCustom(true); return }
    setShowCustom(false)
    const { debut: d, fin: f } = getDefaults(range)
    setDebut(d); setFin(f)
    navigate(d, f)
  }

  const handleCustomApply = () => navigate(debut, fin)

  // Sync avec URL au premier rendu
  useEffect(() => {
    const d = searchParams.get('debut')
    const f = searchParams.get('fin')
    if (d) setDebut(d)
    if (f) setFin(f)
  }, [searchParams])

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <CalendarDays className="w-4 h-4 text-gray-400 shrink-0" />

      {/* Boutons rapides */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg flex-wrap">
        {RANGES.map(r => (
          <button
            key={r.id}
            onClick={() => handleQuick(r.id)}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap',
              quick === r.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Dates personnalisées */}
      {showCustom && (
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="date"
            value={debut}
            max={fin}
            onChange={e => setDebut(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-xs text-gray-400">→</span>
          <input
            type="date"
            value={fin}
            min={debut}
            max={format(new Date(), 'yyyy-MM-dd')}
            onChange={e => setFin(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleCustomApply}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
          >
            Appliquer
          </button>
        </div>
      )}

      {/* Résumé période active */}
      {!showCustom && (
        <span className="text-xs text-gray-400">
          {debut} → {fin}
        </span>
      )}
    </div>
  )
}
