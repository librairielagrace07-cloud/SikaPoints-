import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserPermissions } from '@/lib/permissions'
import { formatMontant } from '@/lib/utils'
import {
  ArrowDownCircle, ArrowUpCircle, Store, TrendingUp,
  AlertTriangle, Wallet, TrendingDown,
} from 'lucide-react'
import Link from 'next/link'
import UVCard from './points/[id]/uv-card'
import RealtimeSessions from '@/components/realtime-sessions'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const permissions = await getUserPermissions()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (permissions.role === 'AGENT') {
    return (
      <DashboardAgent
        userId={user!.id}
        pointId={permissions.point_de_vente_id!}
        depuis={today.toISOString()}
        peutModifierUV={permissions.peut_modifier_uv}
      peutRechargerUV={permissions.peut_recharger_uv}
      />
    )
  }

  return <DashboardProprietaire userId={user!.id} depuis={today.toISOString()} />
}

// ─── Vue Agent ────────────────────────────────────────────────────────────────

async function DashboardAgent({
  userId, pointId, depuis, peutModifierUV, peutRechargerUV,
}: { userId: string; pointId: string; depuis: string; peutModifierUV: boolean; peutRechargerUV: boolean }) {
  const supabase = await createClient()

  const [{ data: point }, { data: uvData }, { data: transactions }, { data: allTx }, { data: depEspeces }] = await Promise.all([
    supabase.from('points_de_vente').select('nom, adresse, caisse_initiale').eq('id', pointId).single(),
    supabase.from('uv').select('id, montant, montant_max, seuil_alerte, point_de_vente_id, reseaux(id, nom, couleur)').eq('point_de_vente_id', pointId),
    supabase.from('transactions').select('type, montant, reseaux(nom, couleur), created_at').eq('point_de_vente_id', pointId).gte('created_at', depuis).order('created_at', { ascending: false }),
    supabase.from('transactions').select('type, montant, created_at').eq('point_de_vente_id', pointId),
    supabase.from('depenses').select('montant').eq('point_de_vente_id', pointId).eq('mode_paiement', 'ESPECES'),
  ])

  const p  = point as { nom: string; adresse: string | null; caisse_initiale: number | null } | null
  const uv = (uvData ?? []) as unknown as Array<{ id: string; montant: number; montant_max: number; seuil_alerte: number; point_de_vente_id: string; reseaux: { id: string; nom: string; couleur: string } }>
  const tx = (transactions ?? []) as unknown as Array<{ type: string; montant: number; reseaux: { nom: string; couleur: string }; created_at: string }>
  const txAll = (allTx ?? []) as Array<{ type: string; montant: number; created_at: string }>

  const totalDepots   = tx.filter(t => t.type === 'DEPOT').reduce((s, t) => s + t.montant, 0)
  const totalRetraits = tx.filter(t => t.type === 'RETRAIT').reduce((s, t) => s + t.montant, 0)
  const uvFaibles = uv.filter(u => u.montant <= u.seuil_alerte)

  // Calcul caisse
  const caisseInitiale  = p?.caisse_initiale ?? 0
  const totalCashIn     = txAll.filter(t => t.type === 'DEPOT').reduce((s, t) => s + t.montant, 0)
  const totalCashOut    = txAll.filter(t => t.type === 'RETRAIT').reduce((s, t) => s + t.montant, 0)
  const depEspecesMnt   = (depEspeces ?? []).reduce((s: number, d: { montant: number }) => s + d.montant, 0)
  const soldeCaisse     = caisseInitiale + totalCashIn - totalCashOut - depEspecesMnt
  const variationJour   = totalDepots - totalRetraits

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{p?.nom ?? 'Mon point de vente'}</h1>
        {p?.adresse && <p className="text-gray-500 text-sm mt-1">{p.adresse}</p>}
        <p className="text-gray-400 text-xs mt-0.5">Activité d'aujourd'hui</p>
      </div>

      {/* Alertes UV faibles */}
      {uvFaibles.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-sm font-semibold text-red-800">UV faibles — recharge nécessaire</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {uvFaibles.map((u, i) => (
              <span key={i} className="flex items-center gap-1.5 text-xs bg-white border border-red-200 rounded-full px-3 py-1 text-red-700 font-medium">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: u.reseaux?.couleur }} />
                {u.reseaux?.nom} — {formatMontant(u.montant)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Stats du jour */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <ArrowDownCircle className="w-4 h-4 text-green-500" />
            <span className="text-xs text-gray-500">Dépôts</span>
          </div>
          <p className="text-xl font-bold text-green-600">{formatMontant(totalDepots)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <ArrowUpCircle className="w-4 h-4 text-orange-500" />
            <span className="text-xs text-gray-500">Retraits</span>
          </div>
          <p className="text-xl font-bold text-orange-500">{formatMontant(totalRetraits)}</p>
        </div>
      </div>

      {/* ── Caisse physique ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100 bg-gray-50">
          <div className="p-1.5 bg-blue-100 rounded-lg">
            <Wallet className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-sm font-semibold text-gray-800">Caisse physique</p>
        </div>
        <div className="px-5 py-4">
          <p className="text-2xl font-bold text-gray-900">{formatMontant(soldeCaisse)}</p>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-green-500 shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Entrées totales</p>
                <p className="text-sm font-semibold text-green-600">{formatMontant(totalCashIn)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TrendingDown className="w-3.5 h-3.5 text-red-500 shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Sorties totales</p>
                <p className="text-sm font-semibold text-red-600">{formatMontant(totalCashOut + depEspecesMnt)}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-400">Variation aujourd'hui</span>
            <span className={`text-sm font-bold ${variationJour >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {variationJour >= 0 ? '+' : ''}{formatMontant(variationJour)}
            </span>
          </div>
        </div>
      </div>

      {/* UV par réseau */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">UV disponible</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {uv.map((u, i) => {
            if (peutModifierUV || peutRechargerUV) {
              return (
                <UVCard
                  key={u.id ?? i}
                  uv={{ id: u.id, montant: u.montant, montant_max: u.montant_max, seuil_alerte: u.seuil_alerte, point_de_vente_id: u.point_de_vente_id, reseaux: u.reseaux }}
                  pointId={pointId}
                  peutModifier={peutModifierUV}
                  peutRecharger={peutRechargerUV}
                />
              )
            }
            const faible = u.montant <= u.seuil_alerte
            const pct = u.seuil_alerte > 0 ? Math.min(100, (u.montant / u.seuil_alerte) * 100) : 100
            return (
              <div key={i} className={`bg-white rounded-xl border p-4 ${faible ? 'border-red-200' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: u.reseaux?.couleur }} />
                    <span className="font-medium text-sm text-gray-900">{u.reseaux?.nom}</span>
                  </div>
                  {faible && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Faible</span>}
                </div>
                <p className={`text-2xl font-bold ${faible ? 'text-red-600' : 'text-gray-900'}`}>{formatMontant(u.montant)}</p>
                <div className="mt-2">
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${faible ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Seuil: {formatMontant(u.seuil_alerte)}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Transactions du jour */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Transactions ({tx.length})</h2>
          <Link href="/dashboard/transactions" className="text-sm text-blue-600 hover:underline">Voir tout →</Link>
        </div>
        {tx.length > 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {tx.slice(0, 10).map((t, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  {t.type === 'DEPOT'
                    ? <ArrowDownCircle className="w-5 h-5 text-green-500" />
                    : <ArrowUpCircle className="w-5 h-5 text-orange-500" />
                  }
                  <div>
                    <div className="flex items-center gap-1.5 text-sm">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: (t.reseaux as { couleur: string })?.couleur }} />
                      <span className="font-medium">{(t.reseaux as { nom: string })?.nom}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${t.type === 'DEPOT' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{t.type}</span>
                    </div>
                    <p className="text-xs text-gray-400">{new Date(t.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
                <span className={`font-bold text-sm ${t.type === 'DEPOT' ? 'text-green-600' : 'text-orange-600'}`}>
                  {t.type === 'DEPOT' ? '+' : '-'}{formatMontant(t.montant)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
            Aucune transaction aujourd'hui
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Vue Propriétaire ─────────────────────────────────────────────────────────

async function DashboardProprietaire({ userId, depuis }: { userId: string; depuis: string }) {
  const supabase    = await createClient()
  const adminClient = createAdminClient()

  const { data: points } = await supabase
    .from('points_de_vente')
    .select('id, nom, caisse_initiale')
    .eq('proprietaire_id', userId)

  const pointIds = (points as Array<{ id: string; nom: string; caisse_initiale: number | null }> | null)?.map(p => p.id) ?? []

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const [
    { data: uvData },
    { data: transactionsJour },
    { data: allTx },
    { data: depEspeces },
    { data: sessionsData },
  ] = await Promise.all([
    supabase
      .from('uv')
      .select('montant, seuil_alerte, reseau:reseaux(nom, couleur), point:points_de_vente(nom)')
      .in('point_de_vente_id', pointIds.length > 0 ? pointIds : ['none']),
    supabase
      .from('transactions')
      .select('type, montant')
      .in('point_de_vente_id', pointIds.length > 0 ? pointIds : ['none'])
      .gte('created_at', depuis),
    // Toutes les transactions pour calcul caisse
    supabase
      .from('transactions')
      .select('type, montant, point_de_vente_id')
      .in('point_de_vente_id', pointIds.length > 0 ? pointIds : ['none']),
    // Dépenses espèces
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

  const totalDepots   = (transactionsJour ?? []).filter((t: { type: string }) => t.type === 'DEPOT').reduce((s: number, t: { montant: number }) => s + t.montant, 0)
  const totalRetraits = (transactionsJour ?? []).filter((t: { type: string }) => t.type === 'RETRAIT').reduce((s: number, t: { montant: number }) => s + t.montant, 0)
  const uvFaibles     = (uvData ?? []).filter((u: { montant: number; seuil_alerte: number }) => u.montant <= u.seuil_alerte)

  // ── Calcul solde de caisse global ─────────────────────────────────────────
  type TxRow      = { type: string; montant: number; point_de_vente_id: string }
  type DepRow     = { montant: number; point_de_vente_id: string }
  type PdvRow     = { id: string; nom: string; caisse_initiale: number | null }
  type SessionRow = { point_de_vente_id: string; ouvert_a: string; ferme_a: string | null; nom_agent: string | null }

  const pdvList      = (points     ?? []) as PdvRow[]
  const txAllRows    = (allTx      ?? []) as TxRow[]
  const depRows      = (depEspeces ?? []) as DepRow[]
  const sessionRows  = (sessionsData ?? []) as SessionRow[]

  // Calcul par point
  const caissesParPoint = pdvList.map(p => {
    const ptx  = txAllRows.filter(t => t.point_de_vente_id === p.id)
    const pdep = depRows.filter(d => d.point_de_vente_id === p.id)
    const cashIn  = ptx.filter(t => t.type === 'DEPOT').reduce((s, t) => s + t.montant, 0)
    const cashOut = ptx.filter(t => t.type === 'RETRAIT').reduce((s, t) => s + t.montant, 0)
    const dep     = pdep.reduce((s, d) => s + d.montant, 0)
    const solde   = (p.caisse_initiale ?? 0) + cashIn - cashOut - dep

    // Statut session
    const pSessions = sessionRows.filter(s => s.point_de_vente_id === p.id)
    const sessionOuverte  = pSessions.find(s => s.ferme_a === null)
    const derniereSession = pSessions.find(s => s.ferme_a !== null)
    const statut      = sessionOuverte ? 'ouvert' : derniereSession ? 'ferme' : null
    const statutHeure = sessionOuverte
      ? new Date(sessionOuverte.ouvert_a).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      : derniereSession
        ? new Date(derniereSession.ferme_a!).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        : null

    return { nom: p.nom, solde, cashIn, cashOut, statut, statutHeure }
  })

  const soldeCaisseGlobal = caissesParPoint.reduce((s, p) => s + p.solde, 0)

  return (
    <div className="space-y-6">
      <RealtimeSessions pointIds={pointIds} />
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-500 text-sm mt-1">Vue d'ensemble de vos points Mobile Money</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Dépôts aujourd'hui"      value={formatMontant(totalDepots)}   icon={<ArrowDownCircle className="w-5 h-5 text-green-600" />}  couleur="green" />
        <StatCard label="Retraits aujourd'hui"     value={formatMontant(totalRetraits)} icon={<ArrowUpCircle className="w-5 h-5 text-orange-500" />}   couleur="orange" />
        <StatCard label="Points de vente"          value={String(pdvList.length)}       icon={<Store className="w-5 h-5 text-blue-600" />}             couleur="blue" />
        <StatCard label="Transactions aujourd'hui" value={String((transactionsJour ?? []).length)} icon={<TrendingUp className="w-5 h-5 text-purple-600" />} couleur="purple" />
      </div>

      {/* ── Solde de caisse global ────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Solde de caisse global</p>
              <p className="text-xl font-bold text-gray-900">{formatMontant(soldeCaisseGlobal)}</p>
            </div>
          </div>
          <Link href="/dashboard/points" className="text-xs text-blue-600 hover:underline">
            Détail par point →
          </Link>
        </div>
        {caissesParPoint.length > 0 && (
          <div className="divide-y divide-gray-100">
            {caissesParPoint.map((p, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                    <Store className="w-3.5 h-3.5 text-gray-500" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-gray-800 block truncate">{p.nom}</span>
                    {p.statut === 'ouvert' && (
                      <span className="flex items-center gap-1 text-xs text-green-700 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0" />
                        Ouvert · {p.statutHeure}
                      </span>
                    )}
                    {p.statut === 'ferme' && (
                      <span className="flex items-center gap-1 text-xs text-gray-400 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
                        Fermé · {p.statutHeure}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-green-600 hidden sm:block">+{formatMontant(p.cashIn)}</span>
                  <span className="text-xs text-red-500 hidden sm:block">-{formatMontant(p.cashOut)}</span>
                  <span className={`text-sm font-bold tabular-nums ${p.solde < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                    {formatMontant(p.solde)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Alertes UV */}
      {uvFaibles.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h2 className="font-semibold text-red-800">UV faibles ({uvFaibles.length})</h2>
          </div>
          <div className="space-y-2">
            {uvFaibles.map((uv: { montant: number; seuil_alerte: number; reseau: unknown; point: unknown }, i: number) => {
              const reseau = uv.reseau as unknown as { nom: string; couleur: string }
              const point  = uv.point  as unknown as { nom: string }
              return (
                <div key={i} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: reseau?.couleur }} />
                    <span className="font-medium text-gray-800">{reseau?.nom}</span>
                    <span className="text-gray-500">— {point?.nom}</span>
                  </div>
                  <span className="text-red-600 font-semibold">{formatMontant(uv.montant)}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* UV par réseau */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">UV par réseau</h2>
          <Link href="/dashboard/points" className="text-sm text-blue-600 hover:underline">Voir les points →</Link>
        </div>
        {uvData && (uvData as Array<unknown>).length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(uvData as Array<{ montant: number; seuil_alerte: number; reseau: unknown; point: unknown }>).map((uv, i) => {
              const reseau = uv.reseau as unknown as { nom: string; couleur: string }
              const point  = uv.point  as unknown as { nom: string }
              const faible = uv.montant <= uv.seuil_alerte
              return (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: reseau?.couleur }} />
                      <span className="font-medium text-gray-900 text-sm">{reseau?.nom}</span>
                    </div>
                    {faible && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">UV Faible</span>}
                  </div>
                  <p className="text-xs text-gray-500 mb-1">{point?.nom}</p>
                  <p className={`text-xl font-bold ${faible ? 'text-red-600' : 'text-gray-900'}`}>{formatMontant(uv.montant)}</p>
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Seuil: {formatMontant(uv.seuil_alerte)}</span>
                      <span>{uv.seuil_alerte > 0 ? Math.min(100, Math.round((uv.montant / uv.seuil_alerte) * 100)) : 100}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${faible ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${uv.seuil_alerte > 0 ? Math.min(100, (uv.montant / uv.seuil_alerte) * 100) : 100}%` }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <Store className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Aucun point de vente configuré</p>
            <Link href="/dashboard/points" className="mt-3 inline-block text-sm text-blue-600 font-medium hover:underline">
              Créer un point de vente
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, couleur }: { label: string; value: string; icon: React.ReactNode; couleur: 'green' | 'orange' | 'blue' | 'purple' }) {
  const bg = { green: 'bg-green-50', orange: 'bg-orange-50', blue: 'bg-blue-50', purple: 'bg-purple-50' }[couleur]
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center shrink-0`}>{icon}</div>
        <div>
          <p className="text-xs text-gray-500 leading-tight">{label}</p>
          <p className="text-lg font-bold text-gray-900 leading-tight mt-0.5">{value}</p>
        </div>
      </div>
    </div>
  )
}
