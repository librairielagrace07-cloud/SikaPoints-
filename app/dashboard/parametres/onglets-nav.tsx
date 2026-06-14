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
        className={`relative flex items-center gap-2 lg:gap-3 px-3 py-2 lg:py-2.5 rounded-xl text-sm font-medium transition-colors group overflow-hidden shrink-0 ${
          selected
            ? o.danger ? 'text-red-700' : 'text-blue-700'
            : o.danger ? 'text-red-400 hover:text-red-700' : 'text-gray-500 hover:text-gray-900'
        }`}
      >
        {/* Fond wipe-in */}
        <span className={`absolute inset-0 rounded-xl transition-transform duration-300 ease-out origin-left ${
          selected
            ? o.danger ? 'bg-red-50 scale-x-100' : 'bg-blue-50 scale-x-100'
            : o.danger ? 'bg-red-50 scale-x-0 group-hover:scale-x-100' : 'bg-gray-100/80 scale-x-0 group-hover:scale-x-100'
        }`} />

        {/* Barre indicatrice gauche */}
        <span className={`absolute left-0 rounded-r-full transition-all duration-300 ease-out ${
          selected
            ? o.danger ? 'top-2 bottom-2 w-0.75 bg-red-500 opacity-100' : 'top-2 bottom-2 w-0.75 bg-blue-500 opacity-100'
            : o.danger ? 'top-1/2 -translate-y-1/2 w-0.75 h-0 opacity-0 group-hover:h-5 group-hover:opacity-40 bg-red-400'
                       : 'top-1/2 -translate-y-1/2 w-0.75 h-0 opacity-0 group-hover:h-5 group-hover:opacity-40 bg-blue-500'
        }`} />

        {/* Icône */}
        <Icon className={`w-4 h-4 shrink-0 relative z-10 transition-all duration-200 ${
          selected ? '' : 'group-hover:scale-110 group-hover:-translate-y-px'
        }`} />

        {/* Label */}
        <span className={`relative z-10 transition-transform duration-200 ${selected ? '' : 'group-hover:translate-x-0.5'}`}>
          {o.label}
        </span>

        {/* Point actif */}
        {selected && (
          <span className={`relative z-10 ml-auto w-1.5 h-1.5 rounded-full ${o.danger ? 'bg-red-500' : 'bg-blue-500'}`} />
        )}
      </Link>
    )
  }

  return (
    <nav className="flex lg:flex-col gap-0.5 lg:space-y-0.5">
      {normaux.map(o => <Item key={o.id} o={o} />)}
      {dangereux.length > 0 && (
        <>
          {/* Séparateur : horizontal sur desktop, vertical sur mobile */}
          <div className="hidden lg:block pt-3 mt-3 border-t border-gray-100" />
          <div className="lg:hidden self-stretch w-px bg-gray-200 mx-1 my-1 shrink-0" />
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
