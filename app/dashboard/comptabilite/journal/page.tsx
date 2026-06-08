import { createClient } from '@/lib/supabase/server'
import { getPeriode } from '@/lib/periode'
import { transactionToLignes, depenseToLigne, type TauxMap, type TransactionRow, type DepenseRow } from '@/lib/comptabilite'
import { formatMontant } from '@/lib/utils'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default async function JournalPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const { debut, fin } = getPeriode(params)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: rawPoints } = await supabase
    .from('points_de_vente').select('id').eq('proprietaire_id', user!.id)

  const pointIds = (rawPoints ?? []).map((p: { id: string }) => p.id)

  const [{ data: rawTaux }, { data: rawTx }, { data: rawDep }] = await Promise.all([
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

  const taux: TauxMap = {}
  ;(rawTaux ?? []).forEach((t: { reseau_id: string; taux_depot: number; taux_retrait: number }) => {
    taux[t.reseau_id] = { taux_depot: t.taux_depot, taux_retrait: t.taux_retrait }
  })

  const txRows  = (rawTx  ?? []) as unknown as TransactionRow[]
  const depRows = (rawDep ?? []) as unknown as DepenseRow[]
  const lignes  = [
    ...txRows.flatMap(tx => transactionToLignes(tx, taux)),
    ...depRows.map(depenseToLigne),
  ].sort((a, b) => b.date.localeCompare(a.date))

  const totalDebit = lignes.reduce((s, l) => s + l.montant, 0)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Journal des écritures</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Partie double · {debut} → {fin} · {lignes.length} écriture(s)
          </p>
        </div>
        <div className="text-sm text-gray-500">
          Σ Débit = Σ Crédit = <strong className="text-gray-900">{formatMontant(totalDebit)}</strong>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-5 py-3 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wide">
          <div className="col-span-2">Date</div>
          <div className="col-span-2">Réf.</div>
          <div className="col-span-3">Libellé</div>
          <div className="col-span-2">Compte débit</div>
          <div className="col-span-2">Compte crédit</div>
          <div className="col-span-1 text-right">Montant</div>
        </div>

        {lignes.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">Aucune écriture sur la période</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {lignes.map((l, i) => (
              <div key={i} className={`grid grid-cols-12 gap-2 px-5 py-3 items-start hover:bg-gray-50 ${l.source === 'DEPENSE' ? 'bg-red-50/30' : ''}`}>
                <div className="col-span-2 text-gray-500 text-xs pt-0.5">
                  {format(new Date(l.date), 'dd/MM/yy HH:mm', { locale: fr })}
                </div>
                <div className="col-span-2">
                  <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${l.source === 'DEPENSE' ? 'bg-red-100 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
                    {l.reference}
                  </span>
                </div>
                <div className="col-span-3 text-gray-700 text-xs leading-tight">{l.libelle}</div>
                <div className="col-span-2">
                  <span className="text-xs font-mono bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">{l.compteDebit.code}</span>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{l.compteDebit.libelle}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-xs font-mono bg-green-50 text-green-700 px-1.5 py-0.5 rounded">{l.compteCredit.code}</span>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{l.compteCredit.libelle}</p>
                </div>
                <div className="col-span-1 text-right font-semibold text-gray-900 text-xs">{formatMontant(l.montant)}</div>
              </div>
            ))}
          </div>
        )}

        {lignes.length > 0 && (
          <div className="flex justify-between px-5 py-3 border-t border-gray-200 bg-gray-50 text-sm font-bold">
            <span className="text-gray-700">TOTAUX</span>
            <span className="text-gray-900">{formatMontant(totalDebit)} / {formatMontant(totalDebit)}</span>
          </div>
        )}
      </div>
    </div>
  )
}
