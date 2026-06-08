'use client'

import { useState } from 'react'
import { FileDown, FileSpreadsheet, Loader2 } from 'lucide-react'
import type { ResultatExportData } from '@/lib/export/resultat-pdf'

export default function ExportButtons({ data }: { data: ResultatExportData }) {
  const [loading, setLoading] = useState<'pdf' | 'excel' | null>(null)

  const handlePDF = async () => {
    setLoading('pdf')
    try {
      const { generateResultatPDF } = await import('@/lib/export/resultat-pdf')
      generateResultatPDF(data)
    } finally { setLoading(null) }
  }

  const handleExcel = async () => {
    setLoading('excel')
    try {
      const { generateResultatExcel } = await import('@/lib/export/resultat-excel')
      generateResultatExcel(data)
    } finally { setLoading(null) }
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={handleExcel}
        disabled={loading !== null}
        className="flex items-center gap-1.5 px-3 py-2 border border-green-200 text-green-700 rounded-lg text-sm font-medium hover:bg-green-50 disabled:opacity-50 transition-colors"
      >
        {loading === 'excel'
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <FileSpreadsheet className="w-4 h-4" />
        }
        Excel
      </button>
      <button
        onClick={handlePDF}
        disabled={loading !== null}
        className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {loading === 'pdf'
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <FileDown className="w-4 h-4" />
        }
        PDF
      </button>
    </div>
  )
}
