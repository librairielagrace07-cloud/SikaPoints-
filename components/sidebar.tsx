'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Store, Users, ArrowLeftRight,
  Bell, BarChart3, BookOpen, LogOut, Shield,
  Settings, ChevronsLeft, ChevronsRight, MoreHorizontal, X,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { logout } from '@/lib/actions/auth'
import Logo from '@/components/ui/logo'
import type { UserPermissions } from '@/lib/permissions'
import { getLimits } from '@/lib/plan-limits'

interface SidebarProps {
  nomUtilisateur: string
  emailUtilisateur: string
  avatarUrl: string | null
  notificationsNonLues: number
  permissions: UserPermissions
}

export default function Sidebar({ nomUtilisateur, avatarUrl, notificationsNonLues, permissions }: SidebarProps) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const estProprietaire = permissions.role === 'PROPRIETAIRE'
  const planLimits = getLimits(permissions.plan)

  useEffect(() => {
    const stored = localStorage.getItem('sidebar-collapsed')
    if (stored === 'true') setCollapsed(true)
  }, [])

  const toggleCollapsed = () => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('sidebar-collapsed', String(next))
  }

  // ── Liste complète (desktop + mobile menu) ────────────────────────────────
  const allNavItems = [
    { href: '/dashboard',               label: 'Tableau de bord',  shortLabel: 'Accueil',   icon: LayoutDashboard, visible: true },
    { href: '/dashboard/points',        label: 'Points de vente',  shortLabel: 'Points',    icon: Store,           visible: estProprietaire },
    { href: '/dashboard/agents',        label: 'Agents',           shortLabel: 'Agents',    icon: Users,           visible: estProprietaire },
    { href: '/dashboard/transactions',  label: 'Transactions',     shortLabel: 'Transac.',  icon: ArrowLeftRight,  visible: true },
    { href: '/dashboard/rapports',      label: 'Rapports',         shortLabel: 'Rapports',  icon: BarChart3,       visible: estProprietaire || permissions.peut_voir_rapports },
    { href: '/dashboard/comptabilite',  label: 'Comptabilité',     shortLabel: 'Compta',    icon: BookOpen,        visible: estProprietaire && planLimits.comptabilite },
    { href: '/dashboard/notifications', label: 'Notifications',    shortLabel: 'Notifs',    icon: Bell,            visible: estProprietaire },
    { href: '/dashboard/parametres',    label: 'Paramètres',       shortLabel: 'Réglages',  icon: Settings,        visible: true },
  ].filter(item => item.visible)

  // ── Onglets bottom bar mobile (max 4) ─────────────────────────────────────
  // On priorise les pages les plus utilisées selon le rôle
  const mobileTabHrefs = estProprietaire
    ? ['/dashboard', '/dashboard/transactions', '/dashboard/points', '/dashboard/rapports']
    : [
        '/dashboard',
        '/dashboard/transactions',
        ...(permissions.peut_voir_rapports ? ['/dashboard/rapports'] : []),
        '/dashboard/parametres',
      ]

  const mobileTabs = mobileTabHrefs
    .map(href => allNavItems.find(item => item.href === href))
    .filter(Boolean)
    .slice(0, 4) as typeof allNavItems

  // Items du sheet "Menu" = tout ce qui n'est pas dans le bottom bar
  const mobileMenuNavItems = allNavItems.filter(
    item => !mobileTabs.some(t => t.href === item.href)
  )

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href)

  const menuIsActive = mobileMenuNavItems.some(item => isActive(item.href))

  // ── Desktop sidebar nav ───────────────────────────────────────────────────
  const DesktopNav = () => (
    <>
      <div className={cn(
        'border-b border-gray-100 transition-all duration-300',
        collapsed ? 'px-2 py-4 flex justify-center' : 'px-4 py-3'
      )}>
        {collapsed ? <Logo className="w-10 h-10" /> : <Logo className="w-full" />}
      </div>

      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {allNavItems.map(({ href, label, icon: Icon }) => {
          const active = isActive(href)
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
              <span className={cn(
                'absolute inset-0 rounded-xl transition-transform duration-300 ease-out origin-left',
                active ? 'bg-linear-to-r from-blue-50 to-blue-50/60 scale-x-100' : 'bg-gray-100/80 scale-x-0 group-hover:scale-x-100'
              )} />
              <span className={cn(
                'absolute left-0 rounded-r-full bg-blue-500 transition-all duration-300 ease-out',
                active ? 'top-2 bottom-2 w-0.75 opacity-100' : 'top-1/2 -translate-y-1/2 w-0.75 h-0 opacity-0 group-hover:h-5 group-hover:opacity-40'
              )} />
              <Icon className={cn(
                'w-5 h-5 shrink-0 relative z-10 transition-all duration-200',
                active ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-500 group-hover:scale-110 group-hover:-translate-y-px'
              )} />
              <span className={cn(
                'whitespace-nowrap overflow-hidden relative z-10 transition-all duration-300',
                collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100',
                !active ? 'group-hover:translate-x-0.5' : ''
              )}>
                {label}
              </span>
              {badge && (
                <span className={cn(
                  'relative z-10 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold shrink-0',
                  collapsed ? 'absolute -top-1 -right-1 w-4 h-4 text-[10px]' : 'w-5 h-5 ml-auto'
                )}>
                  {notificationsNonLues > 9 ? '9+' : notificationsNonLues}
                </span>
              )}
              {collapsed && (
                <span className="pointer-events-none absolute left-full ml-3 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50 shadow-lg">
                  {label}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="px-2 py-3 border-t border-gray-100 space-y-0.5">
        <div className={cn('flex items-center px-3 py-2', collapsed ? 'justify-center' : 'gap-3')}>
          <SidebarAvatar nom={nomUtilisateur} url={avatarUrl} />
          <div className={cn('min-w-0 flex-1 overflow-hidden transition-all duration-300', collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100')}>
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
            <span className={cn('whitespace-nowrap overflow-hidden transition-all duration-300', collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100')}>
              Déconnexion
            </span>
            {collapsed && (
              <span className="pointer-events-none absolute left-full ml-3 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50 shadow-lg">
                Déconnexion
              </span>
            )}
          </button>
        </form>
        <button
          onClick={toggleCollapsed}
          title={collapsed ? 'Développer' : undefined}
          className={cn(
            'flex items-center w-full rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-50 hover:text-gray-700 transition-colors group relative mt-1',
            collapsed ? 'px-0 py-2.5 justify-center' : 'px-3 py-2.5 gap-3'
          )}
        >
          {collapsed ? <ChevronsRight className="w-5 h-5 shrink-0" /> : <ChevronsLeft className="w-5 h-5 shrink-0" />}
          <span className={cn('whitespace-nowrap overflow-hidden transition-all duration-300', collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100')}>
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

  return (
    <>
      {/* ── Sidebar desktop ───────────────────────────────────────────────── */}
      <aside className={cn(
        'hidden lg:flex flex-col bg-white border-r border-gray-200 h-screen sticky top-0 transition-all duration-300 ease-in-out overflow-hidden',
        collapsed ? 'w-17' : 'w-64'
      )}>
        <DesktopNav />
      </aside>

      {/* ── Bottom tab bar mobile ─────────────────────────────────────────── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 flex items-stretch h-16 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
        {mobileTabs.map(({ href, shortLabel, icon: Icon }) => {
          const active = isActive(href)
          const isNotif = href === '/dashboard/notifications'
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-1 relative transition-colors duration-150',
                active ? 'text-blue-600' : 'text-gray-400 active:text-gray-600'
              )}
            >
              {/* Indicateur actif en haut */}
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-600 rounded-full" />
              )}
              <div className="relative">
                <Icon className={cn('w-5 h-5 transition-transform duration-150', active && 'scale-110')} />
                {isNotif && notificationsNonLues > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold leading-none">
                    {notificationsNonLues > 9 ? '9+' : notificationsNonLues}
                  </span>
                )}
              </div>
              <span className={cn(
                'text-[10px] font-medium leading-none transition-colors duration-150',
                active ? 'text-blue-600' : 'text-gray-400'
              )}>
                {shortLabel}
              </span>
            </Link>
          )
        })}

        {/* Bouton Menu */}
        <button
          onClick={() => setMenuOpen(true)}
          className={cn(
            'flex-1 flex flex-col items-center justify-center gap-1 relative transition-colors duration-150',
            menuIsActive ? 'text-blue-600' : 'text-gray-400'
          )}
        >
          {menuIsActive && (
            <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-600 rounded-full" />
          )}
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px] font-medium leading-none">Menu</span>
        </button>
      </div>

      {/* ── Sheet "Menu" mobile ───────────────────────────────────────────── */}
      {menuOpen && (
        <div className="lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />

          {/* Sheet */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl overflow-hidden">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>

            {/* Profil utilisateur */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <SidebarAvatar nom={nomUtilisateur} url={avatarUrl} />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{nomUtilisateur}</p>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Shield className="w-3 h-3" />
                    <span>{permissions.role === 'PROPRIETAIRE' ? 'Propriétaire' : 'Agent'}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setMenuOpen(false)}
                className="p-2 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Nav items */}
            {mobileMenuNavItems.length > 0 && (
              <nav className="px-3 py-2">
                {mobileMenuNavItems.map(({ href, label, icon: Icon }) => {
                  const active = isActive(href)
                  const isNotif = href === '/dashboard/notifications'
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                        active ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                      )}
                    >
                      <Icon className={cn('w-5 h-5 shrink-0', active ? 'text-blue-600' : 'text-gray-400')} />
                      <span>{label}</span>
                      {isNotif && notificationsNonLues > 0 && (
                        <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                          {notificationsNonLues > 9 ? '9+' : notificationsNonLues}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </nav>
            )}

            {/* Déconnexion */}
            <div className="px-3 pt-1 pb-6 border-t border-gray-100">
              <form action={logout}>
                <button
                  type="submit"
                  className="flex items-center gap-3.5 w-full px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-5 h-5 shrink-0" />
                  Déconnexion
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── Avatar ─────────────────────────────────────────────────────────────────────
function SidebarAvatar({ nom, url }: { nom: string; url: string | null }) {
  if (url) {
    return (
      <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 ring-2 ring-blue-100">
        <Image src={url} alt={nom} width={36} height={36} className="w-full h-full object-cover" unoptimized />
      </div>
    )
  }
  return (
    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm shrink-0">
      {nom.charAt(0).toUpperCase()}
    </div>
  )
}
