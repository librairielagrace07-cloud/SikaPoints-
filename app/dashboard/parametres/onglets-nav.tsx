'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  User, Lock, Bell, Trash2, Palette, CreditCard,
} from 'lucide-react'
import { Suspense } from 'react'

const ONGLETS = [
  { id: 'profil',     label: 'Profil',         icon: User,       danger: false, proprietaire: false },
  { id: 'abonnement', label: 'Abonnement',      icon: CreditCard, danger: false, proprietaire: true  },
  { id: 'securite',   label: 'Sécurité',        icon: Lock,       danger: false, proprietaire: false },
  { id: 'alertes',    label: 'Alertes UV',      icon: Bell,       danger: false, proprietaire: true  },
  { id: 'apparence',  label: 'Apparence',       icon: Palette,    danger: false, proprietaire: false },
  { id: 'danger',     label: 'Zone dangereuse', icon: Trash2,     danger: true,  proprietaire: true  },
]

function Nav({ estProprietaire }: { estProprietaire: boolean }) {
  const params = useSearchParams()
  const actif = params.get('onglet') ?? 'profil'

  const normaux  = ONGLETS.filter(o => !o.danger && (!o.proprietaire || estProprietaire))
  const dangereux = ONGLETS.filter(o =>  o.danger && (!o.proprietaire || estProprietaire))

  const Item = ({ o }: { o: typeof ONGLETS[number] }) => {
    const Icon = o.icon
    const selected = actif === o.id
    return (
      <Link
        href={`/dashboard/parametres?onglet=${o.id}`}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          selected
            ? o.danger
              ? 'bg-red-50 text-red-700'
              : 'bg-blue-50 text-blue-700'
            : o.danger
            ? 'text-red-500 hover:bg-red-50 hover:text-red-700'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`}
      >
        <Icon className="w-4 h-4 shrink-0" />
        {o.label}
        {selected && (
          <span className={`ml-auto w-1.5 h-1.5 rounded-full ${o.danger ? 'bg-red-500' : 'bg-blue-500'}`} />
        )}
      </Link>
    )
  }

  return (
    <nav className="space-y-0.5">
      {normaux.map(o => <Item key={o.id} o={o} />)}
      {dangereux.length > 0 && (
        <>
          <div className="pt-3 mt-3 border-t border-gray-100" />
          {dangereux.map(o => <Item key={o.id} o={o} />)}
        </>
      )}
    </nav>
  )
}

export default function OngletsNav({ estProprietaire }: { estProprietaire: boolean }) {
  return (
    <Suspense>
      <Nav estProprietaire={estProprietaire} />
    </Suspense>
  )
}
