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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-gray-500 text-sm mt-1">Gérez votre compte et vos préférences</p>
      </div>

      {/* ── Layout 2 colonnes ────────────────────────────────────────────── */}
      <div className="flex gap-8 items-start">

        {/* ── Colonne gauche : profil mini + nav ───────────────────────── */}
        <aside className="w-56 shrink-0 sticky top-6">
          {/* Mini carte profil */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden ring-2 ring-blue-50 mb-3">
                {p?.avatar_url ? (
                  <Image src={p.avatar_url} alt={nom} width={56} height={56} className="w-full h-full object-cover" unoptimized />
                ) : (
                  <span className="text-xl font-bold text-blue-600">{initial}</span>
                )}
              </div>
              <p className="font-semibold text-gray-900 text-sm truncate w-full">{nom}</p>
              <p className="text-xs text-gray-400 truncate w-full mt-0.5">{email}</p>
              <div className={`flex items-center gap-1 mt-2.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                estProprietaire ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {estProprietaire ? <Crown className="w-3 h-3" /> : <BadgeCheck className="w-3 h-3" />}
                {estProprietaire ? 'Propriétaire' : 'Agent'}
              </div>
              <p className="text-[11px] text-gray-300 mt-2">Membre depuis {dateStr}</p>
            </div>
          </div>

          {/* Navigation */}
          <div className="bg-white rounded-xl border border-gray-200 p-2 shadow-sm">
            <OngletsNav estProprietaire={estProprietaire} />
          </div>
        </aside>

        {/* ── Colonne droite : contenu ─────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          <div className={`bg-white rounded-xl border shadow-sm overflow-hidden ${
            isDanger ? 'border-red-200' : 'border-gray-200'
          }`}>

            {/* Header de section */}
            <div className={`px-6 py-5 border-b ${isDanger ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
              <h2 className={`font-bold text-base ${isDanger ? 'text-red-800' : 'text-gray-900'}`}>
                {meta.titre}
              </h2>
              <p className="text-sm text-gray-400 mt-0.5">{meta.description}</p>
            </div>

            {/* Contenu */}
            <div className="px-6 py-6">
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
