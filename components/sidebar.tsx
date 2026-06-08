'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Store,
  Users,
  ArrowLeftRight,
  Bell,
  BarChart3,
  BookOpen,
  LogOut,
  Menu,
  X,
  Shield,
  Settings,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { logout } from '@/lib/actions/auth'
import Logo from '@/components/ui/logo'
import type { UserPermissions } from '@/lib/permissions'

interface SidebarProps {
  nomUtilisateur: string
  emailUtilisateur: string
  avatarUrl: string | null
  notificationsNonLues: number
  permissions: UserPermissions
}

export default function Sidebar({ nomUtilisateur, avatarUrl, notificationsNonLues, permissions }: SidebarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const estProprietaire = permissions.role === 'PROPRIETAIRE'

  // Persist collapse state
  useEffect(() => {
    const stored = localStorage.getItem('sidebar-collapsed')
    if (stored === 'true') setCollapsed(true)
  }, [])

  const toggleCollapsed = () => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('sidebar-collapsed', String(next))
  }

  const navItems = [
    { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard, visible: true },
    { href: '/dashboard/points', label: 'Points de vente', icon: Store, visible: estProprietaire },
    { href: '/dashboard/agents', label: 'Agents', icon: Users, visible: estProprietaire },
    { href: '/dashboard/transactions', label: 'Transactions', icon: ArrowLeftRight, visible: true },
    { href: '/dashboard/rapports', label: 'Rapports', icon: BarChart3, visible: estProprietaire || permissions.peut_voir_rapports },
    { href: '/dashboard/comptabilite', label: 'Comptabilité', icon: BookOpen, visible: estProprietaire },
    { href: '/dashboard/notifications', label: 'Notifications', icon: Bell, visible: estProprietaire },
    { href: '/dashboard/parametres', label: 'Paramètres', icon: Settings, visible: true },
  ].filter(item => item.visible)

  // ── Contenu commun desktop ─────────────────────────────────────────────────
  const DesktopNav = () => (
    <>
      {/* Header logo */}
      <div className={cn(
        'border-b border-gray-100 transition-all duration-300',
        collapsed ? 'px-2 py-4 flex justify-center' : 'px-4 py-3'
      )}>
        {collapsed ? (
          <Logo className="w-10 h-10" />
        ) : (
          <Logo className="w-full" />
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          const badge = href === '/dashboard/notifications' && notificationsNonLues > 0

          return (
            <Link
              key={href}
              href={href}
              prefetch={true}
              title={collapsed ? label : undefined}
              className={cn(
                'relative flex items-center rounded-xl text-sm font-medium transition-colors duration-200 group overflow-hidden',
                collapsed ? 'px-0 py-2.5 justify-center' : 'px-3 py-2.5 gap-3',
                active ? 'text-blue-700' : 'text-gray-500 hover:text-gray-900'
              )}
            >
              {/* Fond wipe-in de gauche à droite */}
              <span className={cn(
                'absolute inset-0 rounded-xl transition-transform duration-300 ease-out origin-left',
                active
                  ? 'bg-linear-to-r from-blue-50 to-blue-50/60 scale-x-100'
                  : 'bg-gray-100/80 scale-x-0 group-hover:scale-x-100'
              )} />

              {/* Barre latérale indicatrice */}
              <span className={cn(
                'absolute left-0 rounded-r-full bg-blue-500 transition-all duration-300 ease-out',
                active
                  ? 'top-2 bottom-2 w-0.75 opacity-100'
                  : 'top-1/2 -translate-y-1/2 w-0.75 h-0 opacity-0 group-hover:h-5 group-hover:opacity-40'
              )} />

              {/* Icône avec rebond */}
              <Icon className={cn(
                'w-5 h-5 shrink-0 relative z-10 transition-all duration-200',
                active
                  ? 'text-blue-600'
                  : 'text-gray-400 group-hover:text-blue-500 group-hover:scale-110 group-hover:-translate-y-px'
              )} />

              {/* Label */}
              <span className={cn(
                'whitespace-nowrap overflow-hidden relative z-10 transition-all duration-300',
                collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100',
                !active ? 'group-hover:translate-x-0.5' : ''
              )}>
                {label}
              </span>

              {/* Badge notifications */}
              {badge && (
                <span className={cn(
                  'relative z-10 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold shrink-0',
                  collapsed ? 'absolute -top-1 -right-1 w-4 h-4 text-[10px]' : 'w-5 h-5 ml-auto'
                )}>
                  {notificationsNonLues > 9 ? '9+' : notificationsNonLues}
                </span>
              )}

              {/* Tooltip collapsed */}
              {collapsed && (
                <span className="pointer-events-none absolute left-full ml-3 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50 shadow-lg">
                  {label}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer utilisateur */}
      <div className="px-2 py-3 border-t border-gray-100 space-y-0.5">
        <div className={cn(
          'flex items-center px-3 py-2',
          collapsed ? 'justify-center' : 'gap-3'
        )}>
          <SidebarAvatar nom={nomUtilisateur} url={avatarUrl} />
          <div className={cn(
            'min-w-0 flex-1 overflow-hidden transition-all duration-300',
            collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
          )}>
            <p className="text-sm font-medium text-gray-900 truncate">{nomUtilisateur}</p>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Shield className="w-3 h-3" />
              <span>{permissions.role === 'PROPRIETAIRE' ? 'Propriétaire' : 'Agent'}</span>
            </div>
          </div>
        </div>

        <form action={logout}>
          <button
            type="submit"
            title={collapsed ? 'Déconnexion' : undefined}
            className={cn(
              'flex items-center w-full rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors group relative',
              collapsed ? 'px-0 py-2.5 justify-center' : 'px-3 py-2.5 gap-3'
            )}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span className={cn(
              'whitespace-nowrap overflow-hidden transition-all duration-300',
              collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
            )}>
              Déconnexion
            </span>
            {collapsed && (
              <span className="pointer-events-none absolute left-full ml-3 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50 shadow-lg">
                Déconnexion
              </span>
            )}
          </button>
        </form>

        {/* Bouton Réduire / Développer */}
        <button
          onClick={toggleCollapsed}
          title={collapsed ? 'Développer' : undefined}
          className={cn(
            'flex items-center w-full rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-50 hover:text-gray-700 transition-colors group relative mt-1',
            collapsed ? 'px-0 py-2.5 justify-center' : 'px-3 py-2.5 gap-3'
          )}
        >
          {collapsed
            ? <ChevronsRight className="w-5 h-5 shrink-0" />
            : <ChevronsLeft className="w-5 h-5 shrink-0" />
          }
          <span className={cn(
            'whitespace-nowrap overflow-hidden transition-all duration-300',
            collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
          )}>
            Réduire
          </span>
          {collapsed && (
            <span className="pointer-events-none absolute left-full ml-3 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50 shadow-lg">
              Développer
            </span>
          )}
        </button>
      </div>
    </>
  )

  // ── Contenu tiroir mobile ──────────────────────────────────────────────────
  const MobileNav = () => (
    <>
      <div className="px-4 py-3 border-b border-gray-100">
        <Logo className="w-full" />
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative',
                active ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span>{label}</span>
              {href === '/dashboard/notifications' && notificationsNonLues > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {notificationsNonLues > 9 ? '9+' : notificationsNonLues}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <SidebarAvatar nom={nomUtilisateur} url={avatarUrl} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 truncate">{nomUtilisateur}</p>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Shield className="w-3 h-3" />
              <span>{permissions.role === 'PROPRIETAIRE' ? 'Propriétaire' : 'Agent'}</span>
            </div>
          </div>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            Déconnexion
          </button>
        </form>
      </div>
    </>
  )

  return (
    <>
      {/* ── Barre top mobile ─────────────────────────────────────────────── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-14 bg-white border-b border-gray-200">
        <Logo className="h-10 w-auto" />
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
          aria-label="Ouvrir menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* ── Overlay mobile ───────────────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Tiroir mobile ────────────────────────────────────────────────── */}
      <div className={cn(
        'lg:hidden fixed top-0 left-0 bottom-0 z-50 w-64 bg-white flex flex-col transition-transform duration-300 ease-in-out shadow-xl',
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex items-center justify-end px-4 h-14 border-b border-gray-100">
          <button
            onClick={() => setMobileOpen(false)}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            aria-label="Fermer menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <MobileNav />
      </div>

      {/* ── Sidebar desktop ───────────────────────────────────────────────── */}
      <aside className={cn(
        'hidden lg:flex flex-col bg-white border-r border-gray-200 h-screen sticky top-0 transition-all duration-300 ease-in-out overflow-hidden',
        collapsed ? 'w-17' : 'w-64'
      )}>
        <DesktopNav />

      </aside>
    </>
  )
}

// ── Avatar compact pour la sidebar ────────────────────────────────────────────
function SidebarAvatar({ nom, url }: { nom: string; url: string | null }) {
  if (url) {
    return (
      <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 ring-2 ring-blue-100">
        <Image src={url} alt={nom} width={32} height={32} className="w-full h-full object-cover" unoptimized />
      </div>
    )
  }
  return (
    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm shrink-0">
      {nom.charAt(0).toUpperCase()}
    </div>
  )
}
