import { createClient } from '@/lib/supabase/server'
import NouveauPointForm from './nouveau-point-form'
import PointsView from './points-view'

export interface PointStat {
  id: string
  nom: string
  adresse: string | null
  telephone: string | null
  caisseInitiale: number
  agentsCount: number
  totalDepots: number
  totalRetraits: number
  soldeCaisse: number
  uvTotal: number
  uvFaibles: number
  uvList: Array<{ nom: string; couleur: string; montant: number; seuil_alerte: number }>
}

export default async function PointsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Points avec UV et agents
  const { data: points } = await supabase
    .from('points_de_vente')
    .select('id, nom, adresse, telephone, caisse_initiale, agents(count), uv(montant, seuil_alerte, reseaux(nom, couleur))')
    .eq('proprietaire_id', user!.id)
    .order('created_at', { ascending: false })

  const pointIds = (points ?? []).map(p => p.id)

  // Transactions all-time (pour caisse + volumes)
  const [{ data: allTx }, { data: depEspeces }] = await Promise.all([
    supabase
      .from('transactions')
      .select('type, montant, point_de_vente_id')
      .in('point_de_vente_id', pointIds.length > 0 ? pointIds : ['none']),
    supabase
      .from('depenses')
      .select('montant, point_de_vente_id')
      .in('point_de_vente_id', pointIds.length > 0 ? pointIds : ['none'])
      .eq('mode_paiement', 'ESPECES'),
  ])

  type TxRow  = { type: string; montant: number; point_de_vente_id: string }
  type DepRow = { montant: number; point_de_vente_id: string }
  const txRows  = (allTx  ?? []) as TxRow[]
  const depRows = (depEspeces ?? []) as DepRow[]

  // Calcul des stats par point
  const stats: PointStat[] = (points ?? []).map(p => {
    const ptx  = txRows.filter(t => t.point_de_vente_id === p.id)
    const pdep = depRows.filter(d => d.point_de_vente_id === p.id)

    const totalDepots   = ptx.filter(t => t.type === 'DEPOT').reduce((s, t)  => s + t.montant, 0)
    const totalRetraits = ptx.filter(t => t.type === 'RETRAIT').reduce((s, t) => s + t.montant, 0)
    const depEspMnt     = pdep.reduce((s, d) => s + d.montant, 0)
    const caisseInit    = (p.caisse_initiale as number | null) ?? 0
    const soldeCaisse   = caisseInit + totalDepots - totalRetraits - depEspMnt

    const uvList = (p.uv as unknown as Array<{ montant: number; seuil_alerte: number; reseaux: { nom: string; couleur: string } }>)?.map(u => ({
      nom: u.reseaux?.nom ?? '—',
      couleur: u.reseaux?.couleur ?? '#888',
      montant: u.montant,
      seuil_alerte: u.seuil_alerte,
    })) ?? []

    const uvTotal  = uvList.reduce((s, u) => s + u.montant, 0)
    const uvFaibles = uvList.filter(u => u.montant <= u.seuil_alerte).length
    const agentsCount = (p.agents as Array<{ count: number }>)?.[0]?.count ?? 0

    return {
      id: p.id,
      nom: p.nom,
      adresse: p.adresse ?? null,
      telephone: p.telephone ?? null,
      caisseInitiale: caisseInit,
      agentsCount,
      totalDepots,
      totalRetraits,
      soldeCaisse,
      uvTotal,
      uvFaibles,
      uvList,
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Points de vente</h1>
          <p className="text-gray-500 text-sm mt-1">{stats.length} point(s) configuré(s)</p>
        </div>
        <NouveauPointForm />
      </div>

      <PointsView stats={stats} />
    </div>
  )
}
