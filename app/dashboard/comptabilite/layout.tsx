import { Suspense } from 'react'
import SubNavLink from './subnav-link'
import PeriodeSelector from './periode-selector'
import { Skeleton } from '@/components/ui/skeleton'

const SUBNAV = [
  { href: '/dashboard/comptabilite',          label: "Vue d'ensemble" },
  { href: '/dashboard/comptabilite/depenses', label: 'Dépenses' },
  { href: '/dashboard/comptabilite/journal',  label: 'Journal' },
  { href: '/dashboard/comptabilite/bilan',    label: 'Bilan & Résultat' },
]

export default function ComptabiliteLayout({ children }: { children: React.ReactNode }) {
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
