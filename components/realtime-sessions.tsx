'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function RealtimeSessions({ pointIds }: { pointIds: string[] }) {
  const router = useRouter()

  useEffect(() => {
    if (pointIds.length === 0) return

    const supabase = createClient()
    const channel = supabase
      .channel('sessions-agents-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sessions_agents' },
        () => {
          router.refresh()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [router, pointIds.join(',')])

  return null
}
