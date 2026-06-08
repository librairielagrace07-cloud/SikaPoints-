import { createAdminClient } from '@/lib/supabase/admin'
import { Users, Store, ArrowUpDown, TrendingUp } from 'lucide-react'

const PLAN_INFO: Record<string, { label: string; prix: number; dot: string; bg: string }> = {
  starter:    { label: 'Starter',    prix: 0,     dot: 'bg-gray-400',   bg: 'bg-gray-100'   },
  solo:       { label: 'Solo',       prix: 1900,  dot: 'bg-blue-500',   bg: 'bg-blue-100'   },
  croissance: { label: 'Croissance', prix: 4900,  dot: 'bg-green-500',  bg: 'bg-green-100'  },
  business:   { label: 'Business',   prix: 12900, dot: 'bg-purple-600', bg: 'bg-purple-100' },
}

function fmt(n: number) {
  return n.toLocaleString('fr-FR')
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | number
  color: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
    </div>
  )
}

export default async function AdminPage() {
  const admin = createAdminClient()

  const now = new Date()
  const debutMois = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [
    { count: totalPoints },
    { count: totalTx },
    { data: txMois },
    { data: allProfils },
  ] = await Promise.all([
    admin.from('points_de_vente').select('*', { count: 'exact', head: true }),
    admin.from('transactions').select('*', { count: 'exact', head: true }),
    admin.from('transactions').select('montant').gte('created_at', debutMois),
    admin.from('profils').select('id, nom_complet, is_super_admin, plan, created_at').eq('role', 'PROPRIETAIRE').order('created_at', { ascending: false }),
  ])

  // Exclure les super admins des stats utilisateurs
  const profils = (allProfils ?? []).filter((p: { is_super_admin: boolean }) => !p.is_super_admin)
  const totalProprio = profils.length

  const volumeMois = (txMois ?? []).reduce(
    (s: number, tx: { montant: number }) => s + tx.montant,
    0
  )

  // Répartition par plan
  const planCounts: Record<string, number> = { starter: 0, solo: 0, croissance: 0, business: 0 }
  for (const row of profils) {
    const plan = (row as { plan: string }).plan
    if (plan in planCounts) planCounts[plan]++
  }

  const revenu =
    planCounts.solo * 1900 + planCounts.croissance * 4900 + planCounts.business * 12900

  const recentUsers = profils.slice(0, 5)

  const kpis = [
    { label: 'Propriétaires inscrits', value: fmt(totalProprio), icon: Users,        color: 'text-blue-600 bg-blue-50'   },
    { label: 'Points de vente',        value: fmt(totalPoints ?? 0), icon: Store,    color: 'text-green-600 bg-green-50' },
    { label: 'Transactions (total)',   value: fmt(totalTx ?? 0), icon: ArrowUpDown,  color: 'text-amber-600 bg-amber-50' },
    { label: 'Volume ce mois (FCFA)',  value: fmt(volumeMois), icon: TrendingUp,     color: 'text-purple-600 bg-purple-50' },
  ]

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-sm text-gray-500 mt-1">Vue globale de l&apos;activité SikaPoints</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map(({ label, value, icon: Icon, color }) => (
          <StatCard key={label} icon={Icon} label={label} value={value} color={color} />
        ))}
      </div>

      {/* Plan breakdown + derniers inscrits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Répartition par plan */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-1">Répartition par plan</h2>
          <p className="text-xs text-gray-400 mb-5">
            Revenu mensuel estimé :{' '}
            <span className="font-semibold text-gray-700">{fmt(revenu)} FCFA</span>
          </p>
          <div className="space-y-4">
            {Object.entries(planCounts).map(([plan, count]) => {
              const info = PLAN_INFO[plan]
              const pct = totalProprio ? Math.round((count / totalProprio) * 100) : 0
              return (
                <div key={plan}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="font-medium text-gray-700 flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${info.dot}`} />
                      {info.label}
                    </span>
                    <span className="text-gray-400 text-xs">
                      {count} · {pct}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${info.dot} rounded-full transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Derniers inscrits */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900">Derniers inscrits</h2>
            <a
              href="/admin/utilisateurs"
              className="text-xs text-green-600 hover:underline font-medium"
            >
              Voir tous →
            </a>
          </div>
          <div className="space-y-3">
            {recentUsers.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">Aucun utilisateur inscrit</p>
            )}
            {recentUsers.map(
              (u: { id: string; nom_complet: string; plan: string; created_at: string }) => {
                const info = PLAN_INFO[u.plan] ?? PLAN_INFO.starter
                return (
                  <div key={u.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-xs font-bold text-green-700 shrink-0">
                        {u.nom_complet.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 leading-tight">
                          {u.nom_complet}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(u.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-medium px-2.5 py-0.5 rounded-full text-gray-700 ${info.bg}`}
                    >
                      {info.label}
                    </span>
                  </div>
                )
              }
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
