'use client'

import { useState } from 'react'
import { FileDown, FileSpreadsheet, Loader2, Store } from 'lucide-react'
import type { ResultatExportData } from '@/lib/export/resultat-pdf'

export interface PointExport {
  id:   string
  nom:  string
  data: ResultatExportData
}

export default function PointExportButtons({ points }: { points: PointExport[] }) {
  const [selectedId, setSelectedId] = useState(points[0]?.id ?? '')
  const [loading,    setLoading]    = useState<'pdf' | 'excel' | null>(null)

  const selected = points.find(p => p.id === selectedId)

  const handlePDF = async () => {
    if (!selected) return
    setLoading('pdf')
    try {
      const { generateResultatPDF } = await import('@/lib/export/resultat-pdf')
      generateResultatPDF(selected.data)
    } finally { setLoading(null) }
  }

  const handleExcel = async () => {
    if (!selected) return
    setLoading('excel')
    try {
      const { generateResultatExcel } = await import('@/lib/export/resultat-excel')
      generateResultatExcel(selected.data)
    } finally { setLoading(null) }
  }

  if (points.length === 0) return null

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1.5">
        <Store className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        <select
          value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
          className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white max-w-[200px] truncate"
        >
          {points.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
        </select>
      </div>
      <button
        onClick={handleExcel}
        disabled={loading !== null || !selected}
        className="flex items-center gap-1.5 px-3 py-1.5 border border-green-200 text-green-700 rounded-lg text-sm font-medium hover:bg-green-50 disabled:opacity-50 transition-colors"
      >
        {loading === 'excel'
          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
          : <FileSpreadsheet className="w-3.5 h-3.5" />
        }
        Excel
      </button>
      <button
        onClick={handlePDF}
        disabled={loading !== null || !selected}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {loading === 'pdf'
          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
          : <FileDown className="w-3.5 h-3.5" />
        }
        PDF
      </button>
    </div>
  )
}
