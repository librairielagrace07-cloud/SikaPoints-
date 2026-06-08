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
        'px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
        active ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
      )}
    >
      {label}
    </Link>
  )
}
