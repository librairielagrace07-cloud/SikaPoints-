'use client'

import { useTransition, useState } from 'react'
import { changerPlan } from '@/lib/actions/admin'
import { Loader2, Check } from 'lucide-react'

const PLANS = [
  { value: 'starter',    label: 'Starter',    bg: 'bg-gray-100',   text: 'text-gray-700'  },
  { value: 'solo',       label: 'Solo',        bg: 'bg-blue-100',   text: 'text-blue-700'  },
  { value: 'croissance', label: 'Croissance',  bg: 'bg-green-100',  text: 'text-green-700' },
  { value: 'business',   label: 'Business',    bg: 'bg-purple-100', text: 'text-purple-700'},
]

export default function PlanSelector({ userId, planActuel }: { userId: string; planActuel: string }) {
  const [pending, startTransition] = useTransition()
  const [plan, setPlan] = useState(planActuel)
  const [saved, setSaved] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const current = PLANS.find(p => p.value === plan) ?? PLANS[0]

  const handleChange = (newPlan: string) => {
    if (newPlan === plan || pending) return
    setPlan(newPlan)
    setSaved(false)
    setErr(null)
    startTransition(async () => {
      try {
        await changerPlan(userId, newPlan)
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      } catch (e) {
        setErr(e instanceof Error ? e.message : 'Erreur')
        setPlan(plan) // rollback visuel
      }
    })
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <select
          value={plan}
          onChange={e => handleChange(e.target.value)}
          disabled={pending}
          className={`
            appearance-none cursor-pointer pl-2.5 pr-6 py-1 rounded-full text-xs font-semibold
            border-0 outline-none focus:ring-2 focus:ring-blue-400
            transition-all disabled:opacity-60
            ${current.bg} ${current.text}
          `}
        >
          {PLANS.map(p => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
        {/* Chevron */}
        <span className={`pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 ${current.text} opacity-60`}>
          ▾
        </span>
      </div>

      {pending && <Loader2 className="w-3.5 h-3.5 text-gray-400 animate-spin shrink-0" />}
      {saved   && <Check   className="w-3.5 h-3.5 text-green-500 shrink-0" />}
      {err     && <span className="text-xs text-red-500">{err}</span>}
    </div>
  )
}
