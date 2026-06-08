'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export default function SubNavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname()
  const active = href === '/dashboard/comptabilite'
    ? pathname === href
    : pathname.startsWith(href)

  return (
    <Link
      href={href}
      className={cn(
        'relative px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap group overflow-hidden',
        active ? 'text-white' : 'text-gray-600 hover:text-gray-900'
      )}
    >
      {/* Fond wipe-in */}
      <span className={cn(
        'absolute inset-0 rounded-xl transition-transform duration-300 ease-out origin-left',
        active ? 'bg-blue-600 scale-x-100' : 'bg-gray-100 scale-x-0 group-hover:scale-x-100'
      )} />
      <span className="relative z-10">{label}</span>
    </Link>
  )
}
