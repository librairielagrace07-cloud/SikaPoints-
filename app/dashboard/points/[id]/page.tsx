import { createClient } from '@/lib/supabase/server'
import { getUserPermissions } from '@/lib/permissions'
import { notFound } from 'next/navigation'
import { formatMontant, formatDate } from '@/lib/utils'
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react'
import UVCard from './uv-card'
import AgentsList from './agents-list'
import TransactionsList from './transactions-list'
import CaisseCard from './caisse-card'
import HistoriqueRecharges from './historique-recharges'

export default async function PointDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const permissions = await getUserPermissions()

  const { data: point } = await supabase
    .from('points_de_vente')
    .select('*')
    .eq('id', id)
    .single()

  if (!point) notFound()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Toutes les requêtes en parallèle
  const [
    { data: uvData },
    { data: agents },
    { data: transactions },
    { data: reseaux },
    { data: allTx },
    { data: depEspeces },
    { data: rechargesUV },
  ] = await Promise.all([
    supabase
      .from('uv')
      .select('*, reseaux(id, nom, couleur)')
      .eq('point_de_vente_id', id),
    supabase
      .from('agents')
      .select('*')
      .eq('point_de_vente_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('transactions')
      .select('*, reseaux(nom, couleur), agents(nom_complet)')
      .eq('point_de_vente_id', id)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase.from('reseaux').select('id, nom, couleur'),
    // Toutes les transactions pour le calcul de caisse (sans limite)
    supabase
      .from('transactions')
      .select('type, montant, created_at')
      .eq('point_de_vente_id', id),
    // Dépenses payées en espèces (sortie de caisse)
    supabase
      .from('depenses')
      .select('montant')
      .eq('point_de_vente_id', id)
      .eq('mode_paiement', 'ESPECES'),
    // Historique des recharges UV
    supabase
      .from('recharges_uv')
      .select('id, montant_recharge, montant_avant, montant_apres, nom_utilisateur, created_at, uv(reseaux(nom, couleur))')
      .eq('point_de_vente_id', id)
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  // ── Calcul caisse physique ─────────────────────────────────────────────────
  const txAll = (allTx ?? []) as Array<{ type: string; montant: number; created_at: string }>

  const totalCashIn      = txAll.filter(t => t.type === 'DEPOT').reduce((s, t) => s + t.montant, 0)
  const totalCashOut     = txAll.filter(t => t.type === 'RETRAIT').reduce((s, t) => s + t.montant, 0)
  const depensesEspeces  = (depEspeces ?? []).reduce((s: number, d: { montant: number }) => s + d.montant, 0)

  const todayTx     = txAll.filter(t => new Date(t.created_at) >= today)
  const variationJour = todayTx.filter(t => t.type === 'DEPOT').reduce((s, t) => s + t.montant, 0)
                      - todayTx.filter(t => t.type === 'RETRAIT').reduce((s, t) => s + t.montant, 0)

  // ── Stats journalières ────────────────────────────────────────────────────
  const depotsJour   = todayTx.filter(t => t.type === 'DEPOT').reduce((s, t) => s + t.montant, 0)
  const retraitsJour = todayTx.filter(t => t.type === 'RETRAIT').reduce((s, t) => s + t.montant, 0)

  const caisseInitiale = (point.caisse_initiale as number | null) ?? 0
  const estProprietaire = permissions.role === 'PROPRIETAIRE'

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <a href="/dashboard/points" className="hover:text-blue-600">Points de vente</a>
          <span>/</span>
          <span className="text-gray-900 font-medium">{point.nom}</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{point.nom}</h1>
        {point.adresse && <p className="text-gray-500 text-sm">{point.adresse}</p>}
        {point.telephone && <p className="text-gray-500 text-sm">{point.telephone}</p>}
      </div>

      {/* ── Stats journalières ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Ligne 1 : aujourd'hui */}
        <div className="grid grid-cols-2 divide-x divide-gray-100">
          <div className="p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <ArrowDownCircle className="w-3.5 h-3.5 text-green-500" />
              <span className="text-xs text-gray-500 font-medium">Dépôts aujourd'hui</span>
            </div>
            <p className="text-xl font-bold text-green-600">{formatMontant(depotsJour)}</p>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <ArrowUpCircle className="w-3.5 h-3.5 text-orange-500" />
              <span className="text-xs text-gray-500 font-medium">Retraits aujourd'hui</span>
            </div>
            <p className="text-xl font-bold text-orange-500">{formatMontant(retraitsJour)}</p>
          </div>
        </div>
        {/* Ligne 2 : totaux globaux */}
        <div className="grid grid-cols-2 divide-x divide-gray-100 border-t border-gray-100 bg-gray-50">
          <div className="px-4 py-3">
            <p className="text-xs text-gray-400 mb-0.5">Total dépôts</p>
            <p className="text-base font-semibold text-green-700">{formatMontant(totalCashIn)}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs text-gray-400 mb-0.5">Total retraits</p>
            <p className="text-base font-semibold text-orange-600">{formatMontant(totalCashOut)}</p>
          </div>
        </div>
      </div>

      {/* ── Caisse physique ───────────────────────────────────────────────── */}
      <CaisseCard
        pointId={id}
        caisseInitiale={caisseInitiale}
        totalCashIn={totalCashIn}
        totalCashOut={totalCashOut}
        depensesEspeces={depensesEspeces}
        variationJour={variationJour}
        estProprietaire={estProprietaire}
      />

      {/* UV par réseau */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">UV disponible</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {uvData?.map(uv => (
            <UVCard
              key={uv.id}
              uv={uv}
              pointId={id}
              peutModifier={estProprietaire || permissions.peut_modifier_uv}
              peutRecharger={estProprietaire || permissions.peut_recharger_uv}
            />
          ))}
        </div>
      </div>

      {/* Historique des recharges UV */}
      <HistoriqueRecharges recharges={(rechargesUV ?? []) as unknown as Parameters<typeof HistoriqueRecharges>[0]['recharges']} />

      {/* Agents */}
      <AgentsList agents={agents ?? []} pointId={id} />

      {/* Transactions récentes */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Transactions récentes</h2>
        <TransactionsList
          transactions={transactions ?? []}
          reseaux={reseaux ?? []}
          agents={agents ?? []}
          pointId={id}
        />
      </div>
    </div>
  )
}
