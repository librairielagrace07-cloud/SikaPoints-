import { createClient } from '@/lib/supabase/server'
import { formatMontant } from '@/lib/utils'
import { getPeriode } from '@/lib/periode'
import { transactionToLignes, depenseToLigne, computeBalance, computeResultat, type TauxMap, type TransactionRow, type DepenseRow } from '@/lib/comptabilite'
import TauxCommissionForm from './taux-commission-form'
import { TrendingUp, TrendingDown, Scale, Receipt } from 'lucide-react'
import { subMonths, startOfMonth, format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default async function ComptabilitePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const { debut, fin } = getPeriode(params)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: rawPoints } = await supabase
    .from('points_de_vente').select('id, nom').eq('proprietaire_id', user!.id)

  const points    = (rawPoints ?? []) as Array<{ id: string; nom: string }>
  const pointIds  = points.map(p => p.id)

  const [{ data: rawReseaux }, { data: rawTaux }, { data: rawTx }, { data: rawDep }] = await Promise.all([
    supabase.from('reseaux').select('id, nom, couleur'),
    supabase.from('taux_commission').select('reseau_id, taux_depot, taux_retrait').eq('proprietaire_id', user!.id),
    supabase.from('transactions')
      .select('id, type, montant, reseau_id, created_at, reseaux(nom, couleur), points_de_vente(nom)')
      .in('point_de_vente_id', pointIds.length > 0 ? pointIds : ['none'])
      .gte('created_at', debut + 'T00:00:00')
      .lte('created_at', fin   + 'T23:59:59')
      .order('created_at', { ascending: false }),
    supabase.from('depenses')
      .select('id, date_depense, libelle, montant, compte_code, compte_libelle, compte_contrepartie, libelle_contrepartie, point_de_vente_id, mode_paiement, note, created_at, points_de_vente(nom)')
      .eq('proprietaire_id', user!.id)
      .gte('date_depense', debut)
      .lte('date_depense', fin)
      .order('date_depense', { ascending: false }),
  ])

  const reseaux = (rawReseaux ?? []) as Array<{ id: string; nom: string; couleur: string }>
  const taux: TauxMap = {}
  ;(rawTaux ?? []).forEach((t: { reseau_id: string; taux_depot: number; taux_retrait: number }) => {
    taux[t.reseau_id] = { taux_depot: t.taux_depot, taux_retrait: t.taux_retrait }
  })

  const txRows  = (rawTx  ?? []) as unknown as TransactionRow[]
  const depRows = (rawDep ?? []) as unknown as DepenseRow[]
  const lignes  = [...txRows.flatMap(tx => transactionToLignes(tx, taux)), ...depRows.map(depenseToLigne)]

  const balance  = computeBalance(lignes)
  const resultat = computeResultat(balance)

  // Évolution mensuelle sur la période sélectionnée (max 6 points)
  const nbMois = Math.min(6, Math.ceil((new Date(fin).getTime() - new Date(debut).getTime()) / (30 * 24 * 3600 * 1000)) + 1)
  const mois: Array<{ label: string; produits: number; charges: number }> = []
  for (let i = nbMois - 1; i >= 0; i--) {
    const m    = subMonths(new Date(fin), i)
    const dM   = format(startOfMonth(m), 'yyyy-MM-dd')
    const fM   = format(new Date(Math.min(new Date(fin).getTime(), startOfMonth(subMonths(m, -1)).getTime() - 1)), 'yyyy-MM-dd')
    const lM   = lignes.filter(l => l.date.slice(0, 10) >= dM && l.date.slice(0, 10) <= fM)
    const resM = computeResultat(computeBalance(lM))
    mois.push({ label: format(m, 'MMM yy', { locale: fr }), produits: resM.totalProduits, charges: resM.totalCharges })
  }

  const KPIS = [
    { label: 'Produits',     value: formatMontant(resultat.totalProduits), icon: TrendingUp,   color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-100' },
    { label: 'Charges',      value: formatMontant(resultat.totalCharges),  icon: TrendingDown, color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-100' },
    { label: 'Résultat net', value: formatMontant(resultat.resultatNet),   icon: Scale,        color: resultat.resultatNet >= 0 ? 'text-blue-600' : 'text-red-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    { label: 'Dépenses',     value: formatMontant(depRows.reduce((s,d)=>s+d.montant,0)), icon: Receipt, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Comptabilité SYSCOHADA</h1>
        <p className="text-gray-500 text-sm mt-1">
          {debut} → {fin} · {lignes.length} écriture(s)
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KPIS.map(k => (
          <div key={k.label} className={`${k.bg} border ${k.border} rounded-xl p-4`}>
            <div className="flex items-center gap-2 mb-1">
              <k.icon className={`w-4 h-4 ${k.color}`} />
              <p className="text-xs text-gray-500">{k.label}</p>
            </div>
            <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Évolution mensuelle</h2>
          {mois.every(m => m.produits === 0 && m.charges === 0) ? (
            <p className="text-sm text-gray-400 text-center py-6">Aucune donnée sur la période</p>
          ) : (
            <div className="space-y-3">
              {mois.map(m => {
                const maxVal = Math.max(...mois.map(x => x.produits + x.charges), 1)
                return (
                  <div key={m.label}>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span className="font-medium">{m.label}</span>
                      <span className={m.produits >= m.charges ? 'text-green-600' : 'text-red-600'}>
                        {formatMontant(m.produits - m.charges)}
                      </span>
                    </div>
                    <div className="flex gap-1 h-3">
                      <div className="bg-green-400 rounded-full" style={{ width: `${(m.produits / maxVal) * 100}%` }} />
                      <div className="bg-red-400 rounded-full"   style={{ width: `${(m.charges  / maxVal) * 100}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          <div className="flex gap-4 mt-4 pt-3 border-t border-gray-100 text-xs">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-400 inline-block" />Produits</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-400 inline-block" />Charges</span>
          </div>
        </div>

        <TauxCommissionForm reseaux={reseaux} taux={taux} />
      </div>

      {depRows.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Dernières dépenses</h2>
            <a href="/dashboard/comptabilite/depenses" className="text-sm text-blue-600 hover:underline">Voir tout</a>
          </div>
          <div className="divide-y divide-gray-100">
            {depRows.slice(0, 5).map(d => (
              <div key={d.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{d.libelle}</p>
                  <p className="text-xs text-gray-400">{d.compte_code} · {d.compte_libelle}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-red-600">-{formatMontant(d.montant)}</p>
                  <p className="text-xs text-gray-400">{d.date_depense}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
