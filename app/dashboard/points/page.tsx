import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import NouveauPointForm from './nouveau-point-form'
import PointsView from './points-view'
import { getLimits, getPlanLabel } from '@/lib/plan-limits'
import RealtimeSessions from '@/components/realtime-sessions'

export interface PointStat {
  id: string
  nom: string
  adresse: string | null
  telephone: string | null
  caisseInitiale: number
  agentsCount: number
  depotsJour: number
  retraitsJour: number
  totalDepots: number
  totalRetraits: number
  soldeCaisse: number
  uvTotal: number
  uvFaibles: number
  uvList: Array<{ nom: string; couleur: string; montant: number; seuil_alerte: number }>
  statut: 'ouvert' | 'ferme' | null
  statutHeure: string | null
  statutNomAgent: string | null
}

export default async function PointsPage() {
  const supabase      = await createClient()
  const adminClient   = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Plan de l'utilisateur
  const { data: profil } = await supabase.from('profils').select('plan').eq('id', user!.id).single()
  const plan = (profil as { plan: string | null } | null)?.plan
  const limits = getLimits(plan)

  // Points avec UV et agents
  const { data: points } = await supabase
    .from('points_de_vente')
    .select('id, nom, adresse, telephone, caisse_initiale, agents(count), uv(montant, seuil_alerte, reseaux(nom, couleur))')
    .eq('proprietaire_id', user!.id)
    .order('created_at', { ascending: false })

  const pointIds = (points ?? []).map(p => p.id)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Transactions all-time (pour caisse + volumes) + sessions agents
  const [{ data: allTx }, { data: depEspeces }, { data: sessionsData }] = await Promise.all([
    supabase
      .from('transactions')
      .select('type, montant, point_de_vente_id, created_at')
      .in('point_de_vente_id', pointIds.length > 0 ? pointIds : ['none']),
    supabase
      .from('depenses')
      .select('montant, point_de_vente_id')
      .in('point_de_vente_id', pointIds.length > 0 ? pointIds : ['none'])
      .eq('mode_paiement', 'ESPECES'),
    // Sessions agents récentes — 48h pour capturer sessions ouvertes hier encore actives
    adminClient
      .from('sessions_agents')
      .select('point_de_vente_id, ouvert_a, ferme_a, nom_agent')
      .in('point_de_vente_id', pointIds.length > 0 ? pointIds : ['none'])
      .gte('ouvert_a', new Date(Date.now() - 48 * 3600 * 1000).toISOString())
      .order('ouvert_a', { ascending: false }),
  ])

  type TxRow      = { type: string; montant: number; point_de_vente_id: string; created_at: string }
  type DepRow     = { montant: number; point_de_vente_id: string }
  type SessionRow = { point_de_vente_id: string; ouvert_a: string; ferme_a: string | null; nom_agent: string | null }
  const txRows      = (allTx       ?? []) as TxRow[]
  const depRows     = (depEspeces  ?? []) as DepRow[]
  const sessionRows = (sessionsData ?? []) as SessionRow[]

  // Calcul des stats par point
  const stats: PointStat[] = (points ?? []).map(p => {
    const ptx      = txRows.filter(t => t.point_de_vente_id === p.id)
    const ptxJour  = ptx.filter(t => new Date(t.created_at) >= today)
    const pdep     = depRows.filter(d => d.point_de_vente_id === p.id)

    const depotsJour    = ptxJour.filter(t => t.type === 'DEPOT').reduce((s, t)   => s + t.montant, 0)
    const retraitsJour  = ptxJour.filter(t => t.type === 'RETRAIT').reduce((s, t) => s + t.montant, 0)
    const totalDepots   = ptx.filter(t => t.type === 'DEPOT').reduce((s, t)       => s + t.montant, 0)
    const totalRetraits = ptx.filter(t => t.type === 'RETRAIT').reduce((s, t)     => s + t.montant, 0)
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

    // Statut session du point
    const pSessions = sessionRows.filter(s => s.point_de_vente_id === p.id)
    const sessionOuverte = pSessions.find(s => s.ferme_a === null)
    const derniereSession = pSessions.find(s => s.ferme_a !== null)

    let statut: 'ouvert' | 'ferme' | null = null
    let statutHeure: string | null = null
    let statutNomAgent: string | null = null

    if (sessionOuverte) {
      statut = 'ouvert'
      statutHeure = new Date(sessionOuverte.ouvert_a).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      statutNomAgent = sessionOuverte.nom_agent
    } else if (derniereSession) {
      statut = 'ferme'
      statutHeure = new Date(derniereSession.ferme_a!).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      statutNomAgent = derniereSession.nom_agent
    }

    return {
      id: p.id,
      nom: p.nom,
      adresse: p.adresse ?? null,
      telephone: p.telephone ?? null,
      caisseInitiale: caisseInit,
      agentsCount,
      depotsJour,
      retraitsJour,
      totalDepots,
      totalRetraits,
      soldeCaisse,
      uvTotal,
      uvFaibles,
      uvList,
      statut,
      statutHeure,
      statutNomAgent,
    }
  })

  const atLimit = limits.maxPoints < 999 && stats.length >= limits.maxPoints

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Points de vente</h1>
          <p className="text-gray-500 text-sm mt-1">
            {stats.length} point(s) configuré(s)
            {limits.maxPoints < 999 && (
              <span className={`ml-2 font-medium ${atLimit ? 'text-amber-600' : 'text-gray-400'}`}>
                · {stats.length}/{limits.maxPoints} ({getPlanLabel(plan)})
              </span>
            )}
          </p>
        </div>
        <NouveauPointForm atLimit={atLimit} maxPoints={limits.maxPoints} />
      </div>

      <RealtimeSessions pointIds={pointIds} />
      <PointsView stats={stats} />
    </div>
  )
}
