import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserPermissions, type UserPermissions } from '@/lib/permissions'
import Sidebar from '@/components/sidebar'
import OfflineBanner from '@/components/ui/offline-banner'

// Charge le nom, avatar et compteur de notifs — non bloquant (Suspense)
async function SidebarMeta({
  userId,
  email,
  permissions,
}: {
  userId: string
  email: string
  permissions: UserPermissions
}) {
  const supabase = await createClient()
  const [{ data: profil }, { count }] = await Promise.all([
    supabase.from('profils').select('nom_complet, avatar_url').eq('id', userId).single(),
    supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('destinataire_id', userId)
      .eq('lu', false),
  ])
  const p = profil as { nom_complet: string; avatar_url: string | null } | null
  return (
    <Sidebar
      nomUtilisateur={p?.nom_complet ?? email}
      emailUtilisateur={email}
      avatarUrl={p?.avatar_url ?? null}
      notificationsNonLues={count ?? 0}
      permissions={permissions}
    />
  )
}

// Affiché instantanément pendant que SidebarMeta charge
function SidebarFallback({
  email,
  permissions,
}: {
  email: string
  permissions: UserPermissions
}) {
  return (
    <Sidebar
      nomUtilisateur={email}
      emailUtilisateur={email}
      avatarUrl={null}
      notificationsNonLues={0}
      permissions={permissions}
    />
  )
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  // getSession() lit depuis le cookie — zéro appel réseau
  // Le middleware a déjà vérifié le token avec getUser(), donc c'est sûr ici
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  // Passe userId pour éviter un 2e getUser() dans getUserPermissions
  const permissions = await getUserPermissions(session.user.id)

  if (permissions.role === 'AGENT' && !permissions.point_de_vente_id) {
    redirect('/compte-suspendu')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Suspense
        fallback={
          <SidebarFallback email={session.user.email ?? ''} permissions={permissions} />
        }
      >
        <SidebarMeta
          userId={session.user.id}
          email={session.user.email ?? ''}
          permissions={permissions}
        />
      </Suspense>
      <main className="flex-1 overflow-y-auto lg:p-8 p-4 pb-20 lg:pb-8">
        <OfflineBanner />
        {children}
      </main>
    </div>
  )
}
