import { createAdminClient } from '@/lib/supabase/admin'
import { CreditCard } from 'lucide-react'

const PLANS = [
  { id: 'starter',    label: 'Starter',    prixMensuel: 0,     prixAnnuel: 0,     dot: 'bg-gray-400',   ring: 'ring-gray-200'   },
  { id: 'solo',       label: 'Solo',       prixMensuel: 1900,  prixAnnuel: 1500,  dot: 'bg-blue-500',   ring: 'ring-blue-200'   },
  { id: 'croissance', label: 'Croissance', prixMensuel: 4900,  prixAnnuel: 3900,  dot: 'bg-green-500',  ring: 'ring-green-200'  },
  { id: 'business',   label: 'Business',   prixMensuel: 12900, prixAnnuel: 9900,  dot: 'bg-purple-600', ring: 'ring-purple-200' },
]

function fmt(n: number) {
  return n === 0 ? 'Gratuit' : n.toLocaleString('fr-FR') + ' FCFA'
}

export default async function AdminAbonnementsPage() {
  const admin = createAdminClient()

  const { data: allProfils } = await admin
    .from('profils')
    .select('id, nom_complet, is_super_admin, plan, plan_debut, created_at')
    .eq('role', 'PROPRIETAIRE')
    .order('plan')
    .order('created_at', { ascending: false })

  const profils = (allProfils ?? []).filter((p: { is_super_admin: boolean }) => !p.is_super_admin)

  const planCounts: Record<string, number> = {}
  for (const p of profils) {
    const plan = (p as { plan: string }).plan
    planCounts[plan] = (planCounts[plan] ?? 0) + 1
  }

  const revenuMensuel = PLANS.reduce((sum, p) => sum + (planCounts[p.id] ?? 0) * p.prixMensuel, 0)
  const revenuAnnuel  = PLANS.reduce((sum, p) => sum + (planCounts[p.id] ?? 0) * p.prixAnnuel * 12, 0)

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Abonnements</h1>
          <p className="text-sm text-gray-500 mt-1">Répartition par plan et revenus estimés</p>
        </div>
        <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
          <CreditCard className="w-5 h-5 text-green-600" />
        </div>
      </div>

      {/* Revenus */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Revenu mensuel estimé</p>
          <p className="text-3xl font-bold text-gray-900">{revenuMensuel.toLocaleString('fr-FR')} FCFA</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Revenu annuel estimé</p>
          <p className="text-3xl font-bold text-gray-900">{revenuAnnuel.toLocaleString('fr-FR')} FCFA</p>
        </div>
      </div>

      {/* Cartes par plan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {PLANS.map(plan => {
          const count = planCounts[plan.id] ?? 0
          const revM  = count * plan.prixMensuel
          const revA  = count * plan.prixAnnuel * 12
          return (
            <div
              key={plan.id}
              className={`bg-white rounded-2xl border border-gray-200 p-5 shadow-sm ring-1 ${plan.ring}`}
            >
              <div className="flex items-center gap-2 mb-4">
                <span className={`w-2.5 h-2.5 rounded-full ${plan.dot}`} />
                <span className="font-semibold text-gray-900 text-sm">{plan.label}</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{count}</p>
              <p className="text-xs text-gray-500 mb-3">
                {count === 1 ? 'utilisateur' : 'utilisateurs'}
              </p>
              {plan.prixMensuel > 0 ? (
                <div className="text-xs text-gray-500 space-y-0.5 border-t border-gray-100 pt-3">
                  <p>Mensuel : <span className="font-medium text-gray-700">{revM.toLocaleString('fr-FR')} FCFA</span></p>
                  <p>Annuel :  <span className="font-medium text-gray-700">{revA.toLocaleString('fr-FR')} FCFA</span></p>
                </div>
              ) : (
                <p className="text-xs text-gray-400 border-t border-gray-100 pt-3">Plan gratuit</p>
              )}
            </div>
          )
        })}
      </div>

      {/* Tableau détail */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Détail des abonnements</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Propriétaire</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Plan</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Depuis</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">/ mois</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {profils.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-gray-400 text-sm">
                    Aucun utilisateur inscrit
                  </td>
                </tr>
              )}
              {profils.map(
                (u: {
                  id: string
                  nom_complet: string
                  plan: string
                  plan_debut: string | null
                  created_at: string
                }) => {
                  const planInfo = PLANS.find(p => p.id === u.plan) ?? PLANS[0]
                  const since = u.plan_debut ?? u.created_at
                  return (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-xs font-bold text-green-700 shrink-0">
                            {u.nom_complet.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-900">{u.nom_complet}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-700">
                          <span className={`w-2 h-2 rounded-full ${planInfo.dot}`} />
                          {planInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                        {new Date(since).toLocaleDateString('fr-FR', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-3.5 text-right font-semibold text-gray-900 text-xs">
                        {fmt(planInfo.prixMensuel)}
                      </td>
                    </tr>
                  )
                }
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
