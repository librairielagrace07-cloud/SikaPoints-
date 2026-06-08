import { createClient } from '@/lib/supabase/server'
import { getPeriode } from '@/lib/periode'
import { transactionToLignes, depenseToLigne, computeBalance, computeResultat, type TauxMap, type TransactionRow, type DepenseRow } from '@/lib/comptabilite'
import { formatMontant } from '@/lib/utils'
import ExportButtons from './export-buttons'
import PointExportButtons, { type PointExport } from './point-export-buttons'

export default async function BilanPage({
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

  const pointIds = (rawPoints ?? []).map((p: { id: string; nom: string }) => p.id)

  const [{ data: rawTaux }, { data: rawTx }, { data: rawDep }] = await Promise.all([
    supabase.from('taux_commission').select('reseau_id, taux_depot, taux_retrait').eq('proprietaire_id', user!.id),
    supabase.from('transactions')
      .select('id, type, montant, reseau_id, point_de_vente_id, created_at, reseaux(nom, couleur), points_de_vente(nom)')
      .in('point_de_vente_id', pointIds.length > 0 ? pointIds : ['none'])
      .gte('created_at', debut + 'T00:00:00')
      .lte('created_at', fin   + 'T23:59:59')
      .order('created_at', { ascending: false }),
    supabase.from('depenses')
      .select('id, date_depense, libelle, montant, compte_code, compte_libelle, compte_contrepartie, libelle_contrepartie, point_de_vente_id, mode_paiement, note, created_at, points_de_vente(nom)')
      .eq('proprietaire_id', user!.id)
      .gte('date_depense', debut)
      .lte('date_depense', fin),
  ])

  const taux: TauxMap = {}
  ;(rawTaux ?? []).forEach((t: { reseau_id: string; taux_depot: number; taux_retrait: number }) => {
    taux[t.reseau_id] = { taux_depot: t.taux_depot, taux_retrait: t.taux_retrait }
  })

  const txRows  = (rawTx  ?? []) as unknown as TransactionRow[]
  const depRows = (rawDep ?? []) as unknown as DepenseRow[]
  const lignes  = [...txRows.flatMap(tx => transactionToLignes(tx, taux)), ...depRows.map(depenseToLigne)]
  const balance  = computeBalance(lignes)
  const resultat = computeResultat(balance)

  const classe5 = balance.filter(l => l.code.startsWith('5'))
  const classe6 = balance.filter(l => l.code.startsWith('6'))
  const classe7 = balance.filter(l => l.code.startsWith('7'))
  const totalDebit  = balance.reduce((s, l) => s + l.totalDebit, 0)
  const totalCredit = balance.reduce((s, l) => s + l.totalCredit, 0)

  // ── Export global ──────────────────────────────────────────────────────────
  const exportData = { debut, fin, ...resultat, balance }

  // ── Export par point de vente ──────────────────────────────────────────────
  const pointsExport: PointExport[] = (rawPoints ?? []).map((p: { id: string; nom: string }) => {
    const ptx  = txRows.filter(tx  => tx.point_de_vente_id === p.id)
    const pdep = depRows.filter(dep => dep.point_de_vente_id === p.id)
    const pLignes  = [...ptx.flatMap(tx => transactionToLignes(tx, taux)), ...pdep.map(depenseToLigne)]
    const pBalance = computeBalance(pLignes)
    const pResultat = computeResultat(pBalance)
    return {
      id:  p.id,
      nom: p.nom,
      data: { debut, fin, ...pResultat, balance: pBalance, nomPoint: p.nom },
    }
  })

  return (
    <div className="space-y-8">
      {/* En-tête avec export */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bilan & Compte de résultat</h1>
          <p className="text-gray-500 text-sm mt-0.5">SYSCOHADA · {debut} → {fin}</p>
        </div>

        <div className="flex flex-col gap-2 items-end">
          {/* Export global — tous les points confondus */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-medium">Rapport global</span>
            <ExportButtons data={exportData} />
          </div>

          {/* Export par point — sélecteur + boutons */}
          {pointsExport.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-medium">Par point</span>
              <PointExportButtons points={pointsExport} />
            </div>
          )}
        </div>
      </div>

      {/* Compte de résultat */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 bg-green-50 border-b border-green-100">
            <h2 className="font-semibold text-green-800">Classe 7 — Produits d'exploitation</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {classe7.length === 0 ? (
              <p className="px-5 py-8 text-sm text-gray-400 text-center">
                Aucun produit — configurez vos taux de commission sur la vue d'ensemble
              </p>
            ) : classe7.map(l => (
              <div key={l.code} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono bg-green-50 text-green-700 px-1.5 py-0.5 rounded">{l.code}</span>
                  <span className="text-sm text-gray-700">{l.libelle}</span>
                </div>
                <span className="text-sm font-semibold text-green-700">{formatMontant(l.soldeCrediteur)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between px-5 py-3 border-t border-green-100 bg-green-50">
            <span className="text-sm font-bold text-green-800">Total Produits</span>
            <span className="text-sm font-bold text-green-700">{formatMontant(resultat.totalProduits)}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 bg-red-50 border-b border-red-100">
            <h2 className="font-semibold text-red-800">Classe 6 — Charges d'exploitation</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {classe6.length === 0 ? (
              <p className="px-5 py-8 text-sm text-gray-400 text-center">Aucune charge enregistrée</p>
            ) : classe6.map(l => (
              <div key={l.code} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono bg-red-50 text-red-700 px-1.5 py-0.5 rounded">{l.code}</span>
                  <span className="text-sm text-gray-700">{l.libelle}</span>
                </div>
                <span className="text-sm font-semibold text-red-700">{formatMontant(l.soldeDebiteur)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between px-5 py-3 border-t border-red-100 bg-red-50">
            <span className="text-sm font-bold text-red-800">Total Charges</span>
            <span className="text-sm font-bold text-red-700">{formatMontant(resultat.totalCharges)}</span>
          </div>
        </div>
      </div>

      {/* Résultat net */}
      <div className={`rounded-xl border-2 p-6 ${resultat.resultatNet >= 0 ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Résultat net de la période</p>
            <p className="text-xs text-gray-400 mt-0.5">Total Produits − Total Charges</p>
          </div>
          <div className="text-right">
            <p className={`text-3xl font-bold ${resultat.resultatNet >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              {resultat.resultatNet >= 0 ? '+' : ''}{formatMontant(resultat.resultatNet)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {formatMontant(resultat.totalProduits)} − {formatMontant(resultat.totalCharges)}
            </p>
          </div>
        </div>
      </div>

      {/* Balance des comptes */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Balance des comptes</h2>
        {classe5.length > 0 && <BalanceSection titre="Classe 5 — Trésorerie" rows={classe5} />}
        {classe6.length > 0 && <BalanceSection titre="Classe 6 — Charges"    rows={classe6} />}
        {classe7.length > 0 && <BalanceSection titre="Classe 7 — Produits"   rows={classe7} />}

        {balance.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mt-2">
            <div className="grid grid-cols-12 gap-2 px-5 py-3 bg-gray-800 text-white text-sm font-bold">
              <div className="col-span-5">TOTAUX GÉNÉRAUX</div>
              <div className="col-span-3 text-right">{formatMontant(totalDebit)}</div>
              <div className="col-span-2 text-right">{formatMontant(totalCredit)}</div>
              <div className="col-span-1 text-right">{formatMontant(balance.reduce((s,l)=>s+l.soldeDebiteur,0))}</div>
              <div className="col-span-1 text-right">{formatMontant(balance.reduce((s,l)=>s+l.soldeCrediteur,0))}</div>
            </div>
          </div>
        )}

        {balance.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 py-16 text-center text-gray-400 text-sm">
            Aucune donnée sur la période sélectionnée
          </div>
        )}
      </div>
    </div>
  )
}

function BalanceSection({ titre, rows }: { titre: string; rows: ReturnType<typeof computeBalance> }) {
  return (
    <div className="mb-4">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{titre}</h3>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-5 py-2.5 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wide">
          <div className="col-span-2">Compte</div>
          <div className="col-span-3">Intitulé</div>
          <div className="col-span-3 text-right">Total Débit</div>
          <div className="col-span-2 text-right">Total Crédit</div>
          <div className="col-span-1 text-right">Sd. Deb.</div>
          <div className="col-span-1 text-right">Sd. Cré.</div>
        </div>
        <div className="divide-y divide-gray-100">
          {rows.map(l => (
            <div key={l.code} className="grid grid-cols-12 gap-2 px-5 py-2.5 items-center hover:bg-gray-50">
              <div className="col-span-2">
                <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">{l.code}</span>
              </div>
              <div className="col-span-3 text-gray-700 text-xs truncate">{l.libelle}</div>
              <div className="col-span-3 text-right text-xs text-gray-600">{formatMontant(l.totalDebit)}</div>
              <div className="col-span-2 text-right text-xs text-gray-600">{formatMontant(l.totalCredit)}</div>
              <div className="col-span-1 text-right text-xs font-medium text-amber-700">
                {l.soldeDebiteur  > 0 ? formatMontant(l.soldeDebiteur)  : ''}
              </div>
              <div className="col-span-1 text-right text-xs font-medium text-green-700">
                {l.soldeCrediteur > 0 ? formatMontant(l.soldeCrediteur) : ''}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
