'use client'

import { useEffect, useState } from 'react'
import { Wifi, WifiOff, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'
import { useOffline } from '@/hooks/use-offline'

export default function OfflineBanner() {
  const { isOnline, pendingCount, syncing, lastSyncResult, sync } = useOffline()
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    if (lastSyncResult && lastSyncResult.synced > 0) {
      setShowSuccess(true)
      const t = setTimeout(() => setShowSuccess(false), 4000)
      return () => clearTimeout(t)
    }
  }, [lastSyncResult])

  // Rien à afficher quand tout est normal
  if (isOnline && pendingCount === 0 && !syncing && !showSuccess) return null

  // Hors ligne
  if (!isOnline) {
    return (
      <div className="flex items-center gap-3 px-4 py-2.5 mb-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800">
        <WifiOff className="w-4 h-4 shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium">Mode hors ligne</span>
          {pendingCount > 0 && (
            <span className="ml-2 text-xs text-amber-700">
              · {pendingCount} transaction{pendingCount > 1 ? 's' : ''} en attente
            </span>
          )}
        </div>
        <span className="text-xs bg-amber-100 border border-amber-300 text-amber-700 rounded-full px-2.5 py-0.5 font-medium">
          Hors ligne
        </span>
      </div>
    )
  }

  // Synchronisation en cours
  if (syncing) {
    return (
      <div className="flex items-center gap-3 px-4 py-2.5 mb-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-800">
        <RefreshCw className="w-4 h-4 shrink-0 animate-spin" />
        <span className="text-sm font-medium flex-1">Synchronisation en cours…</span>
        {pendingCount > 0 && (
          <span className="text-xs text-blue-600">{pendingCount} tx.</span>
        )}
      </div>
    )
  }

  // Synchronisation réussie
  if (showSuccess && lastSyncResult) {
    return (
      <div className="flex items-center gap-3 px-4 py-2.5 mb-4 bg-green-50 border border-green-200 rounded-xl text-green-800">
        <CheckCircle className="w-4 h-4 shrink-0" />
        <span className="text-sm font-medium flex-1">
          {lastSyncResult.synced} transaction{lastSyncResult.synced > 1 ? 's' : ''} synchronisée{lastSyncResult.synced > 1 ? 's' : ''}
        </span>
        {lastSyncResult.errors > 0 && (
          <span className="flex items-center gap-1 text-xs text-red-600">
            <AlertCircle className="w-3 h-3" />
            {lastSyncResult.errors} erreur{lastSyncResult.errors > 1 ? 's' : ''}
          </span>
        )}
      </div>
    )
  }

  // En ligne avec des transactions en attente (sync manuelle)
  if (pendingCount > 0) {
    return (
      <div className="flex items-center gap-3 px-4 py-2.5 mb-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-800">
        <Wifi className="w-4 h-4 shrink-0" />
        <span className="text-sm flex-1">
          {pendingCount} transaction{pendingCount > 1 ? 's' : ''} hors ligne en attente
        </span>
        <button
          onClick={sync}
          className="flex items-center gap-1.5 text-xs bg-blue-600 text-white rounded-full px-3 py-1 hover:bg-blue-700 transition-colors font-medium"
        >
          <RefreshCw className="w-3 h-3" />
          Synchroniser maintenant
        </button>
      </div>
    )
  }

  return null
}
