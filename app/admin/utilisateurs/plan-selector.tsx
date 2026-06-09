'use client'

import { useTransition, useState } from 'react'
import { changerPlan } from '@/lib/actions/admin'
import { Loader2, Check, Pencil, X, CalendarClock } from 'lucide-react'

const PLANS = [
  { value: 'starter',    label: 'Starter',    bg: 'bg-gray-100',    text: 'text-gray-700',   activeBorder: 'border-gray-400',   activeBg: 'bg-gray-100'   },
  { value: 'solo',       label: 'Solo',        bg: 'bg-blue-100',    text: 'text-blue-700',   activeBorder: 'border-blue-500',   activeBg: 'bg-blue-50'    },
  { value: 'croissance', label: 'Croissance',  bg: 'bg-green-100',   text: 'text-green-700',  activeBorder: 'border-green-500',  activeBg: 'bg-green-50'   },
  { value: 'business',   label: 'Business',    bg: 'bg-purple-100',  text: 'text-purple-700', activeBorder: 'border-purple-500', activeBg: 'bg-purple-50'  },
]

const DUREES = [
  { value: 'illimite', label: 'Illimité' },
  { value: '1m',       label: '1 mois'  },
  { value: '3m',       label: '3 mois'  },
  { value: '6m',       label: '6 mois'  },
  { value: '12m',      label: '1 an'    },
  { value: 'custom',   label: 'Personnalisé' },
]

function calcPlanFin(duree: string, dateCustom: string): string | null {
  if (duree === 'illimite') return null
  if (duree === 'custom') return dateCustom ? new Date(dateCustom + 'T23:59:59').toISOString() : null
  const map: Record<string, number> = { '1m': 1, '3m': 3, '6m': 6, '12m': 12 }
  const d = new Date()
  d.setMonth(d.getMonth() + (map[duree] ?? 1))
  return d.toISOString()
}

function Badge({ plan }: { plan: string }) {
  const p = PLANS.find(x => x.value === plan) ?? PLANS[0]
  return (
    <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${p.bg} ${p.text}`}>
      {p.label}
    </span>
  )
}

interface Props {
  userId: string
  planActuel: string
  planFinActuel: string | null
}

export default function PlanSelector({ userId, planActuel, planFinActuel }: Props) {
  const [open, setOpen] = useState(false)
  const [plan, setPlan] = useState(planActuel)
  const [duree, setDuree] = useState('illimite')
  const [dateCustom, setDateCustom] = useState('')
  const [pending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  // État local de plan_fin pour affichage après save
  const [planFin, setPlanFin] = useState(planFinActuel)
  // Plan affiché (mis à jour après save)
  const [planDisplay, setPlanDisplay] = useState(planActuel)

  const todayStr = new Date().toISOString().split('T')[0]
  const canSave = duree !== 'custom' || !!dateCustom

  const handleSave = () => {
    if (!canSave || pending) return
    const newPlanFin = calcPlanFin(duree, dateCustom)
    startTransition(async () => {
      try {
        await changerPlan(userId, plan, newPlanFin)
        setPlanDisplay(plan)
        setPlanFin(newPlanFin)
        setSaved(true)
        setOpen(false)
        setTimeout(() => setSaved(false), 2500)
      } catch (e) {
        setErr(e instanceof Error ? e.message : 'Erreur')
      }
    })
  }

  const expiresSoon = planFin
    ? (new Date(planFin).getTime() - Date.now()) < 7 * 24 * 60 * 60 * 1000
    : false

  return (
    <>
      {/* Affichage dans la ligne du tableau */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge plan={planDisplay} />
        {planFin && (
          <span className={`flex items-center gap-1 text-[11px] ${expiresSoon ? 'text-amber-600 font-medium' : 'text-gray-400'}`}>
            <CalendarClock className="w-3 h-3 shrink-0" />
            {new Date(planFin).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        )}
        <button
          onClick={() => { setOpen(true); setErr(null) }}
          className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
          title="Modifier le plan"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        {saved && <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />}
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 text-sm">Modifier le plan</h3>
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Sélection du plan */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2.5">Plan</p>
                <div className="grid grid-cols-2 gap-2">
                  {PLANS.map(p => (
                    <button
                      key={p.value}
                      onClick={() => setPlan(p.value)}
                      className={`py-2 px-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                        plan === p.value
                          ? `${p.activeBorder} ${p.activeBg} ${p.text}`
                          : 'border-gray-100 text-gray-500 hover:border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Durée */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2.5">Durée</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {DUREES.map(d => (
                    <button
                      key={d.value}
                      onClick={() => setDuree(d.value)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition-all ${
                        duree === d.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-100 text-gray-500 hover:border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>

                {duree === 'custom' && (
                  <input
                    type="date"
                    value={dateCustom}
                    min={todayStr}
                    onChange={e => setDateCustom(e.target.value)}
                    className="mt-2.5 w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}

                {duree !== 'illimite' && duree !== 'custom' && (
                  <p className="mt-2 text-xs text-gray-400">
                    Expiration le {calcPlanFin(duree, '') ? new Date(calcPlanFin(duree, '')!).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}
                  </p>
                )}
              </div>

              {err && <p className="text-xs text-red-500">{err}</p>}
            </div>

            {/* Footer */}
            <div className="flex gap-2 px-5 pb-5">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={pending || !canSave}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {pending
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : 'Enregistrer'
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
