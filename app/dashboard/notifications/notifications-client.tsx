'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import { Bell, AlertTriangle, Info, CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface NotificationItem {
  id: string
  message: string
  type: 'UV_FAIBLE' | 'INFO' | 'ALERTE'
  lu: boolean
  created_at: string
  points_de_vente: { nom: string } | null
  reseaux: { nom: string; couleur: string } | null
}

const icones = {
  UV_FAIBLE: AlertTriangle,
  INFO: Info,
  ALERTE: AlertTriangle,
}

const couleurs = {
  UV_FAIBLE: 'text-red-500',
  INFO: 'text-blue-500',
  ALERTE: 'text-orange-500',
}

export default function NotificationsClient({
  notifications: initial,
  userId,
}: {
  notifications: NotificationItem[]
  userId: string
}) {
  const [notifications, setNotifications] = useState(initial)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `destinataire_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications(prev => [payload.new as NotificationItem, ...prev])
          router.refresh()
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId, router])

  async function marquerLu(id: string) {
    const supabase = createClient()
    await supabase.from('notifications').update({ lu: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, lu: true } : n))
    router.refresh()
  }

  if (notifications.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <Bell className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Aucune notification</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="divide-y divide-gray-100">
        {notifications.map(notif => {
          const Icon = icones[notif.type] ?? Bell
          const colorClass = couleurs[notif.type] ?? 'text-gray-500'
          return (
            <div
              key={notif.id}
              className={`flex items-start gap-4 px-5 py-4 transition-colors ${notif.lu ? '' : 'bg-blue-50/40'}`}
            >
              <div className={`mt-0.5 flex-shrink-0 ${colorClass}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm leading-relaxed ${notif.lu ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
                  {notif.message}
                </p>
                <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-400">
                  <span>{formatDate(notif.created_at)}</span>
                  {notif.points_de_vente && (
                    <><span>·</span><span>{notif.points_de_vente.nom}</span></>
                  )}
                </div>
              </div>
              {!notif.lu && (
                <button
                  onClick={() => marquerLu(notif.id)}
                  className="flex-shrink-0 p-1.5 hover:bg-blue-100 rounded-lg text-blue-500"
                  title="Marquer comme lu"
                >
                  <CheckCircle className="w-4 h-4" />
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
