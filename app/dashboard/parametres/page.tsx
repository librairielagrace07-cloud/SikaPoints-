import { createClient } from '@/lib/supabase/server'
import { getUserPermissions } from '@/lib/permissions'
import ProfilSection from './profil-section'
import SecuriteSection from './securite-section'
import SeuilSection from './seuil-section'
import DangerSection from './danger-section'
import AvatarUpload from './avatar-upload'
import ThemeSection from './theme-section'
import AbonnementSection from './abonnement-section'
import OngletsNav from './onglets-nav'
import Image from 'next/image'
import { Crown, BadgeCheck, Shield } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const TITRES: Record<string, { titre: string; description: string }> = {
  profil:      { titre: 'Profil',           description: 'Photo de profil et informations personnelles' },
  abonnement:  { titre: 'Abonnement',       description: 'Plan actuel, historique et changement de plan' },
  securite:    { titre: 'Sécurité',         description: 'Mot de passe et accès au compte' },
  alertes:     { titre: 'Alertes UV',       description: 'Seuil par défaut pour les nouvelles unités de valeur' },
  apparence:   { titre: 'Apparence',        description: 'Thème et préférences visuelles' },
  danger:      { titre: 'Zone dangereuse',  description: 'Actions irréversibles — à manipuler avec précaution' },
}

export default async function ParametresPage({
  searchParams,
}: {
  searchParams: Promise<{ onglet?: string }>
}) {
  const { onglet = 'profil' } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const permissions = await getUserPermissions()

  const { data: profil } = await supabase
    .from('profils')
    .select('nom_complet, telephone, created_at, avatar_url, plan, plan_debut')
    .eq('id', user!.id)
    .single()

  const p = profil as {
    nom_complet: string; telephone: string | null
    created_at: string; avatar_url: string | null
    plan: string | null; plan_debut: string | null
  } | null

  const { data: paiements } = await supabase
    .from('paiements')
    .select('id, plan, montant, periode, statut, reference_geniuspay, created_at')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(10)

  const seuilDefaut  = (user?.user_metadata?.seuil_uv_defaut as number | undefined) ?? 50000
  const estProprietaire = permissions.role === 'PROPRIETAIRE'
  const nom    = p?.nom_complet ?? '—'
  const email  = user!.email ?? ''
  const initial = nom.charAt(0).toUpperCase()
  const dateStr = p?.created_at
    ? format(new Date(p.created_at), 'd MMM yyyy', { locale: fr })
    : '—'

  const meta = TITRES[onglet] ?? TITRES.profil
  const isDanger = onglet === 'danger'

  return (
    <div>
      {/* ── En-tête page ─────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-gray-500 text-sm mt-1">Gérez votre compte et vos préférences</p>
      </div>

      {/* ── Layout responsive ─────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 items-start">

        {/* ── Sidebar (desktop) / Header compact (mobile) ───────────────── */}
        <aside className="w-full lg:w-56 shrink-0 lg:sticky lg:top-6 space-y-4">

          {/* Carte profil — horizontal sur mobile, verticale sur desktop */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center gap-3 lg:flex-col lg:items-center lg:text-center lg:gap-0">
              <div className="w-12 h-12 lg:w-14 lg:h-14 lg:mb-3 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden ring-2 ring-blue-50 shrink-0">
                {p?.avatar_url ? (
                  <Image src={p.avatar_url} alt={nom} width={56} height={56} className="w-full h-full object-cover" unoptimized />
                ) : (
                  <span className="text-lg lg:text-xl font-bold text-blue-600">{initial}</span>
                )}
              </div>
              <div className="min-w-0 flex-1 lg:flex-none lg:w-full">
                <p className="font-semibold text-gray-900 text-sm truncate">{nom}</p>
                {!email.endsWith('@mmmanager.local') && (
                  <p className="text-xs text-gray-400 truncate mt-0.5">{email}</p>
                )}
                <div className="flex lg:justify-center">
                  <div className={`flex items-center gap-1 mt-1.5 px-2.5 py-1 rounded-full text-xs font-semibold w-fit ${
                    estProprietaire ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {estProprietaire ? <Crown className="w-3 h-3" /> : <BadgeCheck className="w-3 h-3" />}
                    {estProprietaire ? 'Propriétaire' : 'Agent'}
                  </div>
                </div>
                <p className="text-[11px] text-gray-300 mt-1.5 hidden lg:block">Membre depuis {dateStr}</p>
              </div>
            </div>
          </div>

          {/* Navigation — scrollable horizontalement sur mobile */}
          <div className="bg-white rounded-xl border border-gray-200 p-2 shadow-sm overflow-x-auto scrollbar-hide">
            <OngletsNav estProprietaire={estProprietaire} />
          </div>
        </aside>

        {/* ── Contenu principal ─────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 w-full">
          <div className={`bg-white rounded-xl border shadow-sm overflow-hidden ${
            isDanger ? 'border-red-200' : 'border-gray-200'
          }`}>

            {/* Header de section */}
            <div className={`px-4 lg:px-6 py-4 lg:py-5 border-b ${isDanger ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
              <h2 className={`font-bold text-base ${isDanger ? 'text-red-800' : 'text-gray-900'}`}>
                {meta.titre}
              </h2>
              <p className="text-sm text-gray-400 mt-0.5">{meta.description}</p>
            </div>

            {/* Contenu */}
            <div className="px-4 lg:px-6 py-5 lg:py-6">
              {onglet === 'profil' && (
                <div className="space-y-8">
                  <div className="flex flex-col items-center pb-6 border-b border-gray-100">
                    <AvatarUpload userId={user!.id} nom={nom} avatarUrl={p?.avatar_url ?? null} />
                  </div>
                  <ProfilSection
                    nomActuel={nom} email={email}
                    role={permissions.role} telephone={p?.telephone ?? null}
                    dateInscription={p?.created_at ?? ''}
                  />
                </div>
              )}

              {onglet === 'abonnement' && estProprietaire && (
                <AbonnementSection
                  planActuel={p?.plan ?? 'starter'}
                  planDebut={p?.plan_debut ?? null}
                  paiements={(paiements ?? []) as {
                    id: string; plan: string; montant: number; periode: string;
                    statut: string; reference_geniuspay: string | null; created_at: string
                  }[]}
                />
              )}

              {onglet === 'securite' && <SecuriteSection />}

              {onglet === 'alertes' && estProprietaire && <SeuilSection seuilActuel={seuilDefaut} />}

              {onglet === 'apparence' && <ThemeSection />}

              {onglet === 'danger' && estProprietaire && <DangerSection />}
            </div>
          </div>

          {/* Pied de page */}
          <div className="flex items-center gap-2 mt-4 px-1">
            <Shield className="w-3.5 h-3.5 text-gray-300" />
            <p className="text-xs text-gray-400">
              Données chiffrées et sécurisées · SikaPoints ne partage jamais vos informations.
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
