'use client'

import { useEffect, useState, useCallback } from 'react'
import { countPending } from '@/lib/offline/db'
import { syncPendingTransactions } from '@/lib/offline/sync'

export interface SyncResult { synced: number; errors: number }

// Verrou module-level : partagé entre toutes les instances du hook.
// Évite que plusieurs composants (ex. offline-banner + form) déclenchent
// la sync simultanément et insèrent les mêmes transactions en double.
let globalSyncing = false

export function useOffline() {
  const [isOnline,       setIsOnline]       = useState(true)
  const [pendingCount,   setPendingCount]   = useState(0)
  const [syncing,        setSyncing]        = useState(false)
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null)

  const refreshCount = useCallback(async () => {
    try { setPendingCount(await countPending()) } catch { /* IndexedDB absent */ }
  }, [])

  const sync = useCallback(async () => {
    if (globalSyncing) return   // une autre instance tourne déjà
    globalSyncing = true        // posé AVANT le premier await → atomique en JS
    setSyncing(true)
    try {
      const result = await syncPendingTransactions()
      setLastSyncResult(result)
      await refreshCount()
      if (result.synced > 0) {
        setTimeout(() => window.location.reload(), 1800)
      }
    } finally {
      globalSyncing = false
      setSyncing(false)
    }
  }, [refreshCount])

  useEffect(() => {
    if (typeof window === 'undefined') return

    setIsOnline(navigator.onLine)
    refreshCount()

    const onOnline  = () => { setIsOnline(true);  sync() }
    const onOffline = () => setIsOnline(false)

    window.addEventListener('online',  onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online',  onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [sync, refreshCount])

  return { isOnline, pendingCount, syncing, lastSyncResult, sync, refreshCount }
}
