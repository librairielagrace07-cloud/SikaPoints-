import { createAdminClient } from '@/lib/supabase/admin'
import { UserCheck } from 'lucide-react'

const PLAN_BADGE: Record<string, string> = {
  starter:    'bg-gray-100 text-gray-600',
  solo:       'bg-blue-100 text-blue-700',
  croissance: 'bg-green-100 text-green-700',
  business:   'bg-purple-100 text-purple-700',
}

const PLAN_LABEL: Record<string, string> = {
  starter: 'Starter', solo: 'Solo', croissance: 'Croissance', business: 'Business',
}

export default async function AdminUtilisateursPage() {
  const admin = createAdminClient()

  const [
    { data: { users: authUsers } },
    { data: allProfils },
    { data: points },
    { data: agents },
  ] = await Promise.all([
    admin.auth.admin.listUsers({ perPage: 1000 }),
    admin.from('profils').select('id, nom_complet, is_super_admin, plan, created_at').eq('role', 'PROPRIETAIRE').order('created_at', { ascending: false }),
    admin.from('points_de_vente').select('id, proprietaire_id'),
    admin.from('agents').select('id, point_de_vente_id').eq('actif', true),
  ])

  const profils = (allProfils ?? []).filter((p: { is_super_admin: boolean }) => !p.is_super_admin)

  const emailByUserId = new Map(authUsers.map(u => [u.id, u.email ?? '—']))

  // Points par propriétaire
  const nbPointsByProprio = new Map<string, number>()
  const pointOwner = new Map<string, string>()
  for (const p of (points ?? [])) {
    const pdv = p as { id: string; proprietaire_id: string }
    pointOwner.set(pdv.id, pdv.proprietaire_id)
    nbPointsByProprio.set(pdv.proprietaire_id, (nbPointsByProprio.get(pdv.proprietaire_id) ?? 0) + 1)
  }

  // Agents par propriétaire (via les points de vente)
  const agentsCountByProprio = new Map<string, number>()
  for (const a of (agents ?? [])) {
    const ag = a as { point_de_vente_id: string }
    const proprioId = pointOwner.get(ag.point_de_vente_id)
    if (proprioId) {
      agentsCountByProprio.set(proprioId, (agentsCountByProprio.get(proprioId) ?? 0) + 1)
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Utilisateurs</h1>
          <p className="text-sm text-gray-500 mt-1">
            {profils.length} propriétaire{profils.length !== 1 ? 's' : ''} inscrit{profils.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
          <UserCheck className="w-5 h-5 text-blue-600" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nom</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Plan</th>
                <th className="text-center px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Points</th>
                <th className="text-center px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Agents</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Inscrit le</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {profils.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">
                    Aucun utilisateur inscrit
                  </td>
                </tr>
              )}
              {profils.map(
                (u: { id: string; nom_complet: string; plan: string; created_at: string }) => {
                  const badgeClass = PLAN_BADGE[u.plan] ?? PLAN_BADGE.starter
                  const label = PLAN_LABEL[u.plan] ?? u.plan
                  const nbPoints = nbPointsByProprio.get(u.id) ?? 0
                  const nbAgents = agentsCountByProprio.get(u.id) ?? 0
                  return (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-linear-to-br from-green-400 to-green-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                            {u.nom_complet.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-900">{u.nom_complet}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs">{emailByUserId.get(u.id) ?? '—'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-block text-xs font-medium px-2.5 py-0.5 rounded-full ${badgeClass}`}>
                          {label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-semibold text-gray-700">{nbPoints}</td>
                      <td className="px-6 py-4 text-center text-gray-500">{nbAgents}</td>
                      <td className="px-6 py-4 text-gray-500 text-xs whitespace-nowrap">
                        {new Date(u.created_at).toLocaleDateString('fr-FR', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
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
