import { createClient } from '@/lib/supabase/server'
import { getUserPermissions } from '@/lib/permissions'
import { formatMontant, formatDate } from '@/lib/utils'
import { ArrowDownCircle, ArrowUpCircle, Ban } from 'lucide-react'
import NouvelleTransactionForm from './nouvelle-transaction-form'

export default async function TransactionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const permissions = await getUserPermissions()

  // Points accessibles selon le rôle
  let pointIds: string[] = []
  let points: Array<{ id: string; nom: string }> = []

  if (permissions.role === 'PROPRIETAIRE') {
    const { data } = await supabase
      .from('points_de_vente')
      .select('id, nom')
      .eq('proprietaire_id', user!.id)
    points = (data ?? []) as Array<{ id: string; nom: string }>
    pointIds = points.map(p => p.id)
  } else {
    // Agent : seulement son point
    if (permissions.point_de_vente_id) {
      pointIds = [permissions.point_de_vente_id]
      const { data } = await supabase
        .from('points_de_vente')
        .select('id, nom')
        .eq('id', permissions.point_de_vente_id)
        .single()
      if (data) points = [data as { id: string; nom: string }]
    }
  }

  // ID de l'agent connecté (pour le pré-remplir dans le formulaire sans afficher le sélecteur)
  let agentIdConnecte: string | null = null
  if (permissions.role === 'AGENT') {
    const { data: agentRow } = await supabase
      .from('agents')
      .select('id')
      .eq('user_id', user!.id)
      .single()
    agentIdConnecte = (agentRow as { id: string } | null)?.id ?? null
  }

  const [{ data: transactions }, { data: reseaux }] = await Promise.all([
    supabase
      .from('transactions')
      .select('*, reseaux(nom, couleur), agents(nom_complet), points_de_vente(nom)')
      .in('point_de_vente_id', pointIds.length > 0 ? pointIds : ['none'])
      .order('created_at', { ascending: false })
      .limit(100),
    supabase.from('reseaux').select('id, nom, couleur'),
  ])

  const totalDepots = (transactions ?? []).filter(t => t.type === 'DEPOT').reduce((s, t) => s + t.montant, 0)
  const totalRetraits = (transactions ?? []).filter(t => t.type === 'RETRAIT').reduce((s, t) => s + t.montant, 0)

  const peutAjouter = permissions.peut_deposer || permissions.peut_retirer

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-500 text-sm mt-1">{(transactions ?? []).length} transaction(s)</p>
        </div>
        {peutAjouter && points.length > 0 && reseaux && (
          <NouvelleTransactionForm
            points={points}
            reseaux={reseaux as Array<{ id: string; nom: string; couleur: string }>}
            peut_deposer={permissions.peut_deposer}
            peut_retirer={permissions.peut_retirer}
            point_de_vente_fixe={permissions.role === 'AGENT' ? permissions.point_de_vente_id : null}
            agent_id_fixe={agentIdConnecte}
          />
        )}
      </div>

      {/* Message si aucune permission de transaction */}
      {!peutAjouter && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <Ban className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">Accès restreint</p>
            <p className="text-xs text-amber-600 mt-0.5">Vous n'avez pas la permission d'enregistrer des transactions. Contactez votre administrateur.</p>
          </div>
        </div>
      )}

      {/* Totaux */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-center gap-3">
          <ArrowDownCircle className="w-6 h-6 text-green-600 shrink-0" />
          <div>
            <p className="text-xs text-green-700">Total dépôts</p>
            <p className="font-bold text-green-800 text-lg">{formatMontant(totalDepots)}</p>
          </div>
        </div>
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex items-center gap-3">
          <ArrowUpCircle className="w-6 h-6 text-orange-500 shrink-0" />
          <div>
            <p className="text-xs text-orange-700">Total retraits</p>
            <p className="font-bold text-orange-800 text-lg">{formatMontant(totalRetraits)}</p>
          </div>
        </div>
      </div>

      {/* Tableau */}
      {(transactions ?? []).length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Réseau</th>
                  {permissions.role === 'PROPRIETAIRE' && (
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Point</th>
                  )}
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Agent</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Montant</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(transactions ?? []).map(t => {
                  const reseau = t.reseaux as { nom: string; couleur: string }
                  const agent = t.agents as { nom_complet: string } | null
                  const point = t.points_de_vente as { nom: string }
                  return (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {t.type === 'DEPOT'
                            ? <ArrowDownCircle className="w-4 h-4 text-green-500" />
                            : <ArrowUpCircle className="w-4 h-4 text-orange-500" />
                          }
                          <span className={`text-xs px-2 py-0.5 rounded font-medium ${t.type === 'DEPOT' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                            {t.type}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: reseau?.couleur }} />
                          {reseau?.nom}
                        </div>
                      </td>
                      {permissions.role === 'PROPRIETAIRE' && (
                        <td className="px-4 py-3 text-gray-600">{point?.nom}</td>
                      )}
                      <td className="px-4 py-3 text-gray-600">{agent?.nom_complet ?? '—'}</td>
                      <td className={`px-4 py-3 text-right font-semibold ${t.type === 'DEPOT' ? 'text-green-600' : 'text-orange-600'}`}>
                        {t.type === 'DEPOT' ? '+' : '-'}{formatMontant(t.montant)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-400 text-xs">{formatDate(t.created_at)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400">
          Aucune transaction enregistrée
        </div>
      )}
    </div>
  )
}
