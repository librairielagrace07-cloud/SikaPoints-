import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import { revalidatePath } from 'next/cache'
import NotificationsClient from './notifications-client'

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*, points_de_vente(nom), reseaux(nom, couleur)')
    .eq('destinataire_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(50)

  async function marquerToutLu() {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    await supabase
      .from('notifications')
      .update({ lu: true })
      .eq('destinataire_id', user!.id)
      .eq('lu', false)
    revalidatePath('/dashboard/notifications')
    revalidatePath('/dashboard')
  }

  const nonLues = notifications?.filter(n => !n.lu).length ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 text-sm mt-1">
            {nonLues > 0 ? `${nonLues} non lue(s)` : 'Tout est lu'}
          </p>
        </div>
        {nonLues > 0 && (
          <form action={marquerToutLu}>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
            >
              Tout marquer lu
            </button>
          </form>
        )}
      </div>

      <NotificationsClient notifications={notifications ?? []} userId={user!.id} />
    </div>
  )
}
