import { formatMontant } from '@/lib/utils'
import { History, ArrowRight } from 'lucide-react'

interface RechargeUV {
  id: string
  montant_recharge: number
  montant_avant: number
  montant_apres: number
  nom_utilisateur: string | null
  created_at: string
  uv: { reseaux: { nom: string; couleur: string } }
}

export default function HistoriqueRecharges({ recharges }: { recharges: RechargeUV[] }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <History className="w-4 h-4 text-gray-400" />
        <h2 className="text-lg font-semibold text-gray-900">Historique des recharges UV</h2>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{recharges.length}</span>
      </div>

      {recharges.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-400 text-sm">
          Aucune recharge enregistrée pour ce point
        </div>
      ) : (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
        {recharges.map(r => {
          const reseau = r.uv?.reseaux
          const date   = new Date(r.created_at)
          return (
            <div key={r.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                {/* Pastille réseau */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: reseau?.couleur + '22' }}
                >
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: reseau?.couleur }} />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-sm">
                    <span className="font-medium text-gray-900">{reseau?.nom ?? '—'}</span>
                    <span className="text-gray-300">·</span>
                    <span className="text-green-600 font-semibold">+{formatMontant(r.montant_recharge)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                    <span>{formatMontant(r.montant_avant)}</span>
                    <ArrowRight className="w-3 h-3" />
                    <span className="text-gray-600 font-medium">{formatMontant(r.montant_apres)}</span>
                    <span className="text-gray-300 mx-1">·</span>
                    <span>{r.nom_utilisateur ?? '—'}</span>
                  </div>
                </div>
              </div>

              {/* Date */}
              <div className="text-right text-xs text-gray-400 shrink-0 ml-3">
                <p>{date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</p>
                <p>{date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
          )
        })}
      </div>
      )}
    </div>
  )
}
