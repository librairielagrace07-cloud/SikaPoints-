import { createAdminClient } from '@/lib/supabase/admin'
import { Activity } from 'lucide-react'

const RESEAU_BADGE: Record<string, string> = {
  'Wave':         'bg-blue-100 text-blue-700',
  'Orange Money': 'bg-orange-100 text-orange-700',
  'MTN MoMo':     'bg-yellow-100 text-yellow-800',
  'Moov Money':   'bg-green-100 text-green-700',
}

function fmt(n: number) {
  return n.toLocaleString('fr-FR') + ' FCFA'
}

export default async function AdminActivitePage() {
  const admin = createAdminClient()

  const { data: transactions } = await admin
    .from('transactions')
    .select('id, montant, type, created_at, note, points_de_vente(nom), reseaux(nom, couleur)')
    .order('created_at', { ascending: false })
    .limit(100)

  const totalDepots   = (transactions ?? []).filter((t: { type: string }) => t.type === 'DEPOT').reduce((s: number, t: { montant: number }) => s + t.montant, 0)
  const totalRetraits = (transactions ?? []).filter((t: { type: string }) => t.type === 'RETRAIT').reduce((s: number, t: { montant: number }) => s + t.montant, 0)

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activité globale</h1>
          <p className="text-sm text-gray-500 mt-1">100 dernières transactions — tous comptes confondus</p>
        </div>
        <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
          <Activity className="w-5 h-5 text-amber-600" />
        </div>
      </div>

      {/* Mini stats sur les 100 tx affichées */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-widest mb-1">Transactions affichées</p>
          <p className="text-2xl font-bold text-gray-900">{(transactions ?? []).length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <p className="text-xs text-green-600 font-medium uppercase tracking-widest mb-1">Volume dépôts</p>
          <p className="text-2xl font-bold text-green-700">{fmt(totalDepots)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <p className="text-xs text-red-500 font-medium uppercase tracking-widest mb-1">Volume retraits</p>
          <p className="text-2xl font-bold text-red-600">{fmt(totalRetraits)}</p>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Point de vente</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Réseau</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="text-right px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Montant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(transactions ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-sm">
                    Aucune transaction
                  </td>
                </tr>
              )}
              {(transactions ?? []).map((txRaw) => {
                const tx = txRaw as {
                  id: string; montant: number; type: string; created_at: string; note: string | null
                  points_de_vente: { nom: string } | { nom: string }[] | null
                  reseaux: { nom: string; couleur: string } | { nom: string; couleur: string }[] | null
                }
                const pdv    = Array.isArray(tx.points_de_vente) ? tx.points_de_vente[0] : tx.points_de_vente
                const reseau = Array.isArray(tx.reseaux)         ? tx.reseaux[0]         : tx.reseaux
                const d = new Date(tx.created_at)
                const isDepot = tx.type === 'DEPOT'
                const reseauBadge = reseau
                  ? (RESEAU_BADGE[reseau.nom] ?? 'bg-gray-100 text-gray-600')
                  : 'bg-gray-100 text-gray-600'
                return (
                  <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3.5 text-gray-500 text-xs whitespace-nowrap">
                      {d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      <span className="ml-2 text-gray-400">
                        {d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-medium text-gray-800">
                      {pdv?.nom ?? '—'}
                    </td>
                    <td className="px-6 py-3.5">
                      {reseau && (
                        <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${reseauBadge}`}>
                          {reseau.nom}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${
                        isDepot ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                      }`}>
                        {isDepot ? 'Dépôt' : 'Retrait'}
                      </span>
                    </td>
                    <td className={`px-6 py-3.5 text-right font-semibold whitespace-nowrap ${
                      isDepot ? 'text-green-700' : 'text-red-600'
                    }`}>
                      {isDepot ? '+' : '−'}{fmt(tx.montant)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
