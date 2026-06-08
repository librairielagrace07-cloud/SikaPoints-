import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminSidebar from '@/components/admin/admin-sidebar'

export const metadata = {
  title: 'Console Admin — SikaPoints',
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profil } = await supabase
    .from('profils')
    .select('is_super_admin, nom_complet')
    .eq('id', user.id)
    .single()

  const p = profil as { is_super_admin: boolean; nom_complet: string } | null
  if (!p?.is_super_admin) redirect('/dashboard')

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar nom={p.nom_complet} email={user.email ?? ''} />
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  )
}
