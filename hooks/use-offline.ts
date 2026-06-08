'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { countPending } from '@/lib/offline/db'
import { syncPendingTransactions } from '@/lib/offline/sync'

export interface SyncResult { synced: number; errors: number }

export function useOffline() {
  const [isOnline,       setIsOnline]       = useState(true)
  const [pendingCount,   setPendingCount]   = useState(0)
  const [syncing,        setSyncing]        = useState(false)
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null)
  const syncingRef = useRef(false)

  const refreshCount = useCallback(async () => {
    try { setPendingCount(await countPending()) } catch { /* IndexedDB absent */ }
  }, [])

  const sync = useCallback(async () => {
    if (syncingRef.current) return
    syncingRef.current = true
    setSyncing(true)
    try {
      const result = await syncPendingTransactions()
      setLastSyncResult(result)
      await refreshCount()
      if (result.synced > 0) {
        // Rechargement pour afficher les données fraîchement synchronisées
        setTimeout(() => window.location.reload(), 1800)
      }
    } finally {
      syncingRef.current = false
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
