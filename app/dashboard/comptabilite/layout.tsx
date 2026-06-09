import { Suspense } from 'react'
import SubNavLink from './subnav-link'
import PeriodeSelector from './periode-selector'
import { Skeleton } from '@/components/ui/skeleton'
import { createClient } from '@/lib/supabase/server'
import { getLimits } from '@/lib/plan-limits'
import { Lock } from 'lucide-react'
import Link from 'next/link'

const SUBNAV = [
  { href: '/dashboard/comptabilite',          label: "Vue d'ensemble" },
  { href: '/dashboard/comptabilite/depenses', label: 'Dépenses' },
  { href: '/dashboard/comptabilite/journal',  label: 'Journal' },
  { href: '/dashboard/comptabilite/bilan',    label: 'Bilan & Résultat' },
]

export default async function ComptabiliteLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: profil } = await supabase.from('profils').select('plan').eq('id', user.id).single()
    const limits = getLimits((profil as { plan: string | null } | null)?.plan)

    if (!limits.comptabilite) {
      return (
        <div className="flex flex-col items-center justify-center min-h-96 text-center py-16">
          <div className="w-16 h-16 bg-linear-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mb-5 shadow-sm">
            <Lock className="w-7 h-7 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Comptabilité SYSCOHADA</h2>
          <p className="text-gray-500 text-sm mb-1 max-w-sm">
            Disponible à partir du plan <strong className="text-gray-700">Croissance</strong>.
          </p>
          <p className="text-gray-400 text-xs mb-7 max-w-xs">
            Journal SYSCOHADA, bilan, compte de résultat — toutes vos obligations comptables intégrées.
          </p>
          <Link
            href="/dashboard/parametres?onglet=abonnement"
            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            Voir les plans
          </Link>
        </div>
      )
    }
  }

  return (
    <div className="space-y-5">
      {/* Navigation + sélecteur de période */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 w-fit flex-wrap">
          {SUBNAV.map(({ href, label }) => (
            <SubNavLink key={href} href={href} label={label} />
          ))}
        </div>
        <Suspense fallback={<Skeleton className="h-9 w-72 rounded-xl" />}>
          <PeriodeSelector />
        </Suspense>
      </div>

      {children}
    </div>
  )
}
