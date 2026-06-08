'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, CreditCard, Activity, ArrowLeft } from 'lucide-react'
import Logo from '@/components/ui/logo'

const NAV = [
  { href: '/admin',               label: 'Tableau de bord', icon: LayoutDashboard, exact: true  },
  { href: '/admin/utilisateurs',  label: 'Utilisateurs',    icon: Users,           exact: false },
  { href: '/admin/abonnements',   label: 'Abonnements',     icon: CreditCard,      exact: false },
  { href: '/admin/activite',      label: 'Activité globale', icon: Activity,       exact: false },
]

interface Props {
  nom: string
  email: string
}

export default function AdminSidebar({ nom, email }: Props) {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0">
      {/* Logo */}
      <div className="p-5 border-b border-slate-700/60">
        <div className="bg-white rounded-xl px-2 py-2 mb-2">
          <Logo className="w-full" />
        </div>
        <p className="text-xs text-slate-400 px-1">Console Admin</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Utilisateur + lien retour */}
      <div className="p-4 border-t border-slate-700/60 space-y-2">
        <div className="px-3 py-1">
          <p className="text-xs font-medium text-slate-300 truncate">{nom}</p>
          <p className="text-xs text-slate-500 truncate">{email}</p>
        </div>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
          Retour au tableau de bord
        </Link>
      </div>
    </aside>
  )
}
