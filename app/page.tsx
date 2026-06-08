import Link from 'next/link'
import {
  ArrowRight, Check, Bell, Users, FileText,
  WifiOff, BarChart2, Shield, Smartphone, TrendingUp,
  Store, Wallet, RefreshCw, Download,
} from 'lucide-react'
import Logo from '@/components/ui/logo'
import PricingSection from '@/components/landing/pricing-section'
import FaqSection from '@/components/landing/faq-section'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* ══════════════════════════════════════════════════════ NAVBAR */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/">
            <Logo className="h-14 w-auto" />
          </Link>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {[
              { label: 'Fonctionnalités', href: '#fonctionnalites' },
              { label: 'Réseaux',         href: '#reseaux' },
              { label: 'Tarifs',          href: '#tarifs' },
              { label: 'FAQ',             href: '#faq' },
            ].map(l => (
              <a key={l.href} href={l.href} className="text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium">
                {l.label}
              </a>
            ))}
          </nav>

          {/* CTAs */}
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors hidden sm:block">
              Se connecter
            </Link>
            <Link
              href="/register"
              className="flex items-center gap-1.5 bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Essai gratuit
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════ HERO */}
      <section className="relative pt-32 pb-20 overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #0d3b2e 60%, #0f172a 100%)' }}>
        {/* Background décoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 right-0 w-175 h-175 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #16a34a 0%, transparent 70%)' }} />
          <div className="absolute -bottom-20 -left-20 w-100 h-100 rounded-full opacity-8" style={{ background: 'radial-gradient(circle, #0d9488 0%, transparent 70%)' }} />
          {/* Grille de points */}
          <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots)" />
          </svg>
        </div>

        <div className="relative max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: text */}
            <div>
              <div className="inline-flex items-center gap-2 bg-red-900/30 border border-red-700/30 text-red-300 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
                <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                Fini les registres papier — passez au numérique
              </div>

              <h1 className="text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-6">
                Le registre numérique pour vos{' '}
                <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(90deg, #4ade80, #22d3ee)' }}>
                  points Mobile Money
                </span>
              </h1>

              <p className="text-gray-300 text-lg leading-relaxed mb-8 max-w-lg">
                SikaPoints remplace votre carnet de caisse papier. Saisissez les transactions, suivez vos UV, gérez vos agents et exportez vos rapports SYSCOHADA — même sans connexion internet.
              </p>

              <div className="flex items-center gap-4 flex-wrap">
                <Link
                  href="/register"
                  className="flex items-center gap-2 bg-green-600 text-white font-semibold px-6 py-3.5 rounded-xl hover:bg-green-500 transition-colors text-sm shadow-lg shadow-green-900/40"
                >
                  Commencer gratuitement
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="#fonctionnalites"
                  className="flex items-center gap-2 border border-white/20 text-white/80 hover:text-white font-medium px-6 py-3.5 rounded-xl text-sm hover:border-white/40 transition-colors"
                >
                  Voir les fonctionnalités
                </a>
              </div>

              <div className="flex items-center gap-6 mt-8 flex-wrap">
                {[
                  'Installation en 2 minutes',
                  'Aucune carte bancaire requise',
                  'Plan gratuit permanent',
                ].map(t => (
                  <div key={t} className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Check className="w-3.5 h-3.5 text-green-500" />
                    {t}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Dashboard mockup */}
            <div className="relative">
              <div className="relative bg-slate-800/60 backdrop-blur-sm border border-white/10 rounded-2xl shadow-2xl p-4 overflow-hidden">
                {/* Mockup header */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500/70" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                  <div className="w-3 h-3 rounded-full bg-green-500/70" />
                  <div className="flex-1 bg-slate-700/50 rounded-md h-5 mx-2 flex items-center px-2">
                    <span className="text-[9px] text-slate-400">sikapoints.ci/dashboard</span>
                  </div>
                </div>

                {/* Header bar */}
                <div className="flex items-center justify-between mb-4 px-1">
                  <div>
                    <div className="text-white font-bold text-xs">Tableau de bord</div>
                    <div className="text-slate-400 text-[9px]">Aujourd'hui, 08 juin 2026</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-green-400 text-[9px] font-medium">En ligne</span>
                  </div>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[
                    { label: 'Dépôts', val: '1 850 000', color: 'bg-green-500/20 border-green-500/30 text-green-400' },
                    { label: 'Retraits', val: '950 000', color: 'bg-orange-500/20 border-orange-500/30 text-orange-400' },
                    { label: 'Caisse', val: '2 450 000', color: 'bg-blue-500/20 border-blue-500/30 text-blue-400' },
                  ].map(c => (
                    <div key={c.label} className={`border rounded-lg p-2 ${c.color}`}>
                      <div className="text-[8px] opacity-70 mb-0.5">{c.label}</div>
                      <div className="text-[10px] font-bold leading-tight">{c.val}</div>
                      <div className="text-[7px] opacity-50">FCFA</div>
                    </div>
                  ))}
                </div>

                {/* UV bars */}
                <div className="bg-slate-700/40 rounded-xl p-3 mb-3">
                  <div className="text-[9px] text-slate-400 font-medium mb-2.5">UV disponible par réseau</div>
                  {[
                    { nom: 'Wave', couleur: '#2563eb', val: 450000, max: 500000 },
                    { nom: 'Orange Money', couleur: '#ea580c', val: 280000, max: 500000 },
                    { nom: 'MTN MoMo', couleur: '#ca8a04', val: 95000, max: 300000, alerte: true },
                    { nom: 'Moov Money', couleur: '#7c3aed', val: 320000, max: 400000 },
                  ].map(r => (
                    <div key={r.nom} className="mb-2">
                      <div className="flex justify-between items-center mb-0.5">
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: r.couleur }} />
                          <span className="text-[8px] text-slate-300">{r.nom}</span>
                          {r.alerte && <span className="text-[7px] text-red-400 font-bold">⚠</span>}
                        </div>
                        <span className="text-[8px] text-slate-400">{(r.val / 1000).toFixed(0)}k</span>
                      </div>
                      <div className="h-1 bg-slate-600/50 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${(r.val / r.max) * 100}%`, backgroundColor: r.alerte ? '#ef4444' : r.couleur }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Recent transactions */}
                <div className="bg-slate-700/40 rounded-xl p-3">
                  <div className="text-[9px] text-slate-400 font-medium mb-2">Transactions récentes</div>
                  {[
                    { type: 'DEPOT',   reseau: 'Wave',   montant: '+75 000', time: '08:42' },
                    { type: 'RETRAIT', reseau: 'Orange', montant: '-30 000', time: '08:15' },
                    { type: 'DEPOT',   reseau: 'MTN',    montant: '+50 000', time: '07:53' },
                  ].map((t, i) => (
                    <div key={i} className="flex items-center justify-between py-1 border-b border-slate-600/30 last:border-0">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-bold ${t.type === 'DEPOT' ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}`}>
                          {t.type === 'DEPOT' ? '↓' : '↑'}
                        </div>
                        <span className="text-[8px] text-slate-300">{t.reseau}</span>
                      </div>
                      <div className="text-right">
                        <div className={`text-[8px] font-bold ${t.type === 'DEPOT' ? 'text-green-400' : 'text-orange-400'}`}>{t.montant} FCFA</div>
                        <div className="text-[7px] text-slate-500">{t.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Badge flottant */}
              <div className="absolute -right-3 top-12 bg-green-500 text-white text-[9px] font-bold px-2.5 py-1.5 rounded-lg shadow-lg shadow-green-900/40">
                +8% vs hier
              </div>
              <div className="absolute -left-3 bottom-12 bg-white/10 backdrop-blur border border-white/20 text-white text-[9px] font-medium px-3 py-2 rounded-lg shadow-lg">
                <span className="text-yellow-400">⚠</span> MTN MoMo faible
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ RÉSEAUX */}
      <section id="reseaux" className="py-16 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4">
          <p className="text-center text-sm text-gray-400 font-medium uppercase tracking-widest mb-8">
            Compatible avec tous vos réseaux
          </p>
          <div className="flex items-center justify-center gap-6 flex-wrap">
            {[
              { nom: 'Wave',         couleur: '#2563eb', bg: '#dbeafe', lettre: 'W' },
              { nom: 'Orange Money', couleur: '#ea580c', bg: '#ffedd5', lettre: 'O' },
              { nom: 'MTN MoMo',    couleur: '#ca8a04', bg: '#fef9c3', lettre: 'M' },
              { nom: 'Moov Money',  couleur: '#7c3aed', bg: '#ede9fe', lettre: 'M' },
            ].map(r => (
              <div key={r.nom} className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3 hover:shadow-sm transition-shadow">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-white text-sm shadow-md" style={{ backgroundColor: r.couleur }}>
                  {r.lettre}
                </div>
                <span className="font-semibold text-gray-800 text-sm">{r.nom}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ AVANT / APRÈS */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-sm font-semibold text-red-500 uppercase tracking-widest">Le problème</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mt-2 mb-4">
              Votre registre papier a vécu
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              Les opérateurs Mobile Money perdent chaque jour du temps et de l'argent à cause des carnets manuels.
              SikaPoints est la solution.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AVANT */}
            <div className="bg-white border-2 border-red-100 rounded-2xl p-8 relative">
              <div className="absolute -top-3.5 left-6">
                <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow">Avant SikaPoints</span>
              </div>
              <div className="flex items-center gap-3 mb-6 pt-2">
                <span className="text-3xl">📓</span>
                <div>
                  <p className="font-bold text-gray-700">Registre papier</p>
                  <p className="text-xs text-gray-400">Méthode traditionnelle</p>
                </div>
              </div>
              <ul className="space-y-3">
                {[
                  'Calculs manuels — erreurs fréquentes',
                  'Registre perdu = toutes les données perdues',
                  'Impossible de gérer plusieurs points',
                  'Aucun rapport pour la comptabilité',
                  'Pas de suivi des UV par réseau',
                  'Agents sans supervision ni historique',
                  'Pas d\'accès à distance',
                ].map(pb => (
                  <li key={pb} className="flex items-start gap-3 text-sm text-gray-600">
                    <span className="w-5 h-5 rounded-full bg-red-100 text-red-500 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">✕</span>
                    {pb}
                  </li>
                ))}
              </ul>
            </div>

            {/* APRÈS */}
            <div className="bg-white border-2 border-green-200 rounded-2xl p-8 relative shadow-lg shadow-green-100/60">
              <div className="absolute -top-3.5 left-6">
                <span className="bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow">Avec SikaPoints</span>
              </div>
              <div className="flex items-center gap-3 mb-6 pt-2">
                <span className="text-3xl">📱</span>
                <div>
                  <p className="font-bold text-gray-700">Registre numérique</p>
                  <p className="text-xs text-gray-400">Moderne · Fiable · Toujours disponible</p>
                </div>
              </div>
              <ul className="space-y-3">
                {[
                  'Solde calculé automatiquement en temps réel',
                  'Données sécurisées dans le cloud + mode hors ligne',
                  'Multi-points depuis un seul compte',
                  'Export PDF & Excel SYSCOHADA en 1 clic',
                  'UV suivis par réseau avec alertes configurables',
                  'Agents avec permissions et historique complet',
                  'Accessible depuis n\'importe quel appareil',
                ].map(sol => (
                  <li key={sol} className="flex items-start gap-3 text-sm text-gray-600">
                    <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">✓</span>
                    {sol}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ FONCTIONNALITÉS */}
      <section id="fonctionnalites" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold text-green-600 uppercase tracking-widest">Fonctionnalités</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mt-2 mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              Tout ce que votre registre papier ne peut pas faire — automatisé, sécurisé et accessible depuis votre téléphone.
            </p>
          </div>

          {/* Feature 1 : caisse + UV temps réel */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center mb-20">
            <div>
              <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
                <Wallet className="w-3.5 h-3.5" />
                Gestion de caisse
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Caisse physique et UV électroniques en temps réel
              </h3>
              <p className="text-gray-500 leading-relaxed mb-6">
                SikaPoints calcule automatiquement votre solde de caisse physique en tenant compte des dépôts, retraits et dépenses en espèces. Visualisez en un coup d'œil l'écart entre votre cash et vos UV disponibles.
              </p>
              <ul className="space-y-3">
                {[
                  'Solde de caisse calculé en temps réel',
                  'UV disponible par réseau avec seuil d\'alerte',
                  'Variation journalière (gain/perte du jour)',
                  'Ajustement du fond de caisse initial',
                ].map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Visual: caisse card */}
            <div className="bg-linear-to-br from-green-50 to-emerald-100 rounded-2xl p-6 border border-green-100">
              <div className="bg-white rounded-xl shadow-sm p-5 mb-4">
                <div className="flex items-center gap-2 mb-4">
                  <Wallet className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-semibold text-gray-700">Solde de caisse</span>
                  <span className="ml-auto text-xs text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-full">+12 000 FCFA aujourd'hui</span>
                </div>
                <p className="text-3xl font-extrabold text-gray-900 mb-4">2 450 000 FCFA</p>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {[
                    { l: 'Fond initial', v: '1 500 000', c: 'text-gray-500' },
                    { l: '+ Dépôts', v: '+1 850 000', c: 'text-green-600' },
                    { l: '− Retraits', v: '-950 000', c: 'text-orange-500' },
                    { l: '− Dépenses', v: '-75 000', c: 'text-red-500' },
                  ].map(r => (
                    <div key={r.l} className="flex justify-between items-center bg-gray-50 rounded-lg px-3 py-2">
                      <span className="text-gray-400">{r.l}</span>
                      <span className={`font-bold ${r.c}`}>{r.v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="text-xs font-medium text-gray-500 mb-3">UV disponible</div>
                <div className="space-y-2">
                  {[
                    { n: 'Wave', v: 90, c: '#2563eb', ok: true },
                    { n: 'Orange Money', v: 56, c: '#ea580c', ok: true },
                    { n: 'MTN MoMo', v: 18, c: '#ef4444', ok: false },
                    { n: 'Moov Money', v: 80, c: '#7c3aed', ok: true },
                  ].map(r => (
                    <div key={r.n} className="flex items-center gap-2">
                      <span className="text-xs w-24 text-gray-600 truncate">{r.n}</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${r.v}%`, backgroundColor: r.c }} />
                      </div>
                      <span className="text-xs font-medium" style={{ color: r.c }}>{r.v}%</span>
                      {!r.ok && <span className="text-xs text-red-500 font-bold">⚠</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Feature 2 : multi-points */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center mb-20">
            {/* Visual: points comparison */}
            <div className="order-2 lg:order-1 bg-linear-to-br from-slate-900 to-slate-800 rounded-2xl p-6 border border-slate-700">
              <div className="text-xs text-slate-400 font-medium mb-4">Comparaison des performances</div>
              <div className="space-y-3">
                {[
                  { nom: 'Point Pk18',    depot: 1850000, retrait: 950000, rang: 1 },
                  { nom: 'Agence Centre', depot: 1340000, retrait: 780000, rang: 2 },
                  { nom: 'Boutique Abobo', depot: 890000, retrait: 420000, rang: 3 },
                ].map((p, i) => {
                  const vol = p.depot + p.retrait
                  const maxVol = 2800000
                  return (
                    <div key={p.nom} className="bg-slate-700/50 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-amber-400">{['🥇','🥈','🥉'][i]}</span>
                          <span className="text-xs font-semibold text-white">{p.nom}</span>
                        </div>
                        <span className="text-xs text-slate-300 font-mono">{(vol/1000000).toFixed(1)}M</span>
                      </div>
                      <div className="h-1.5 bg-slate-600 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(vol/maxVol)*100}%` }} />
                      </div>
                      <div className="flex gap-3 mt-1.5">
                        <span className="text-[9px] text-green-400">↓ {(p.depot/1000).toFixed(0)}k</span>
                        <span className="text-[9px] text-orange-400">↑ {(p.retrait/1000).toFixed(0)}k</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
                <Store className="w-3.5 h-3.5" />
                Multi-points de vente
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Comparez et gérez plusieurs points depuis un seul compte
              </h3>
              <p className="text-gray-500 leading-relaxed mb-6">
                Pilotez plusieurs points de vente simultanément. Un tableau de comparaison triable vous permet d'identifier vos points les plus performants et ceux qui nécessitent attention.
              </p>
              <ul className="space-y-3">
                {[
                  'Tableau de bord global multi-points',
                  'Classement des points par volume, caisse ou UV',
                  'Rapports exportables par point ou globaux',
                  'Gestion des agents par point de vente',
                ].map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 4 feature cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: <WifiOff className="w-5 h-5" />,
                color: 'bg-amber-50 text-amber-600 border-amber-100',
                titre: 'Mode hors ligne',
                desc: 'Saisissez vos transactions sans internet. Elles se synchronisent automatiquement à la reconnexion.',
              },
              {
                icon: <Bell className="w-5 h-5" />,
                color: 'bg-red-50 text-red-600 border-red-100',
                titre: 'Alertes UV',
                desc: 'Configurez un seuil d\'alerte par réseau. Soyez notifié avant d\'être à court d\'unités.',
              },
              {
                icon: <Users className="w-5 h-5" />,
                color: 'bg-purple-50 text-purple-600 border-purple-100',
                titre: 'Gestion des agents',
                desc: 'Créez des comptes agents avec des permissions précises : dépôts, retraits, modification UV.',
              },
              {
                icon: <FileText className="w-5 h-5" />,
                color: 'bg-blue-50 text-blue-600 border-blue-100',
                titre: 'Comptabilité SYSCOHADA',
                desc: 'Journal, balance des comptes et compte de résultat conformes au plan comptable OHADA.',
              },
              {
                icon: <Download className="w-5 h-5" />,
                color: 'bg-green-50 text-green-600 border-green-100',
                titre: 'Export PDF & Excel',
                desc: 'Téléchargez vos rapports d\'activité et bilans comptables en PDF ou Excel pour une période choisie.',
              },
              {
                icon: <Smartphone className="w-5 h-5" />,
                color: 'bg-teal-50 text-teal-600 border-teal-100',
                titre: 'Application mobile (PWA)',
                desc: 'Installez SikaPoints sur votre téléphone comme une application native, iOS et Android inclus.',
              },
              {
                icon: <Shield className="w-5 h-5" />,
                color: 'bg-slate-50 text-slate-600 border-slate-100',
                titre: 'Sécurité des données',
                desc: 'Chiffrement TLS + Row Level Security Supabase. Chaque propriétaire accède uniquement à ses données.',
              },
              {
                icon: <RefreshCw className="w-5 h-5" />,
                color: 'bg-orange-50 text-orange-600 border-orange-100',
                titre: 'Synchronisation temps réel',
                desc: 'Vos données sont synchronisées instantanément entre tous vos appareils et agents connectés.',
              },
            ].map(c => (
              <div key={c.titre} className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-shadow group">
                <div className={`inline-flex p-2.5 rounded-xl border mb-4 ${c.color}`}>
                  {c.icon}
                </div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm">{c.titre}</h4>
                <p className="text-gray-500 text-xs leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ STATS */}
      <section className="py-16" style={{ background: 'linear-gradient(135deg, #0f172a, #0d3b2e)' }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {[
              { val: '4 réseaux', label: 'Mobile Money supportés' },
              { val: 'Zéro papier', label: 'Registre numérique complet' },
              { val: 'SYSCOHADA', label: 'Comptabilité conforme' },
              { val: 'Gratuit',   label: 'Pour commencer' },
            ].map(s => (
              <div key={s.label}>
                <div className="text-2xl lg:text-3xl font-extrabold text-white mb-1">{s.val}</div>
                <div className="text-sm text-slate-400">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ PRICING */}
      <PricingSection />

      {/* ══════════════════════════════════════════════════════ FAQ */}
      <FaqSection />

      {/* ══════════════════════════════════════════════════════ CTA FINAL */}
      <section className="py-20 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #0d3b2e 100%)' }}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 right-1/4 w-96 h-96 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #16a34a, transparent)' }} />
        </div>

        <div className="relative max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-extrabold text-white mb-4 leading-tight">
                Passez au registre numérique —<br />
                <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(90deg, #4ade80, #22d3ee)' }}>
                  gratuitement dès aujourd'hui
                </span>
              </h2>
              <p className="text-slate-300 text-lg leading-relaxed mb-6">
                Rejoignez les opérateurs Mobile Money qui ont abandonné le carnet papier. Aucune carte bancaire requise, aucun engagement.
              </p>
              <div className="flex items-center gap-4 flex-wrap">
                <Link
                  href="/register"
                  className="flex items-center gap-2 bg-green-600 text-white font-semibold px-6 py-3.5 rounded-xl hover:bg-green-500 transition-colors text-sm"
                >
                  Créer mon compte gratuit
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/login"
                  className="text-sm text-slate-300 hover:text-white transition-colors font-medium"
                >
                  J'ai déjà un compte →
                </Link>
              </div>
              <p className="text-xs text-slate-500 mt-4">
                En créant un compte, vous acceptez nos conditions d'utilisation et notre politique de confidentialité.
              </p>
            </div>

            {/* Person visual placeholder */}
            <div className="hidden lg:flex justify-center">
              <div className="relative">
                <div className="w-64 h-64 rounded-full" style={{ background: 'radial-gradient(circle, #16a34a20, transparent)' }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-6 text-white text-center shadow-2xl">
                    <div className="text-4xl mb-3">📊</div>
                    <div className="font-bold text-lg">Prêt en 2 min</div>
                    <div className="text-sm text-slate-300 mt-1">Configurez votre premier<br />point de vente</div>
                    <div className="mt-4 space-y-1.5 text-left">
                      {['Créez votre compte', 'Ajoutez vos réseaux', 'Invitez vos agents'].map((s, i) => (
                        <div key={s} className="flex items-center gap-2 text-xs text-slate-200">
                          <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center text-[9px] font-bold text-white shrink-0">
                            {i + 1}
                          </div>
                          {s}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ FOOTER */}
      <footer className="bg-gray-900 text-gray-400 py-12 border-t border-gray-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
            {/* Brand */}
            <div className="col-span-2">
              <div className="mb-4">
                <span className="text-white font-bold text-2xl tracking-tight">Sika<span className="text-green-400">Points</span></span>
              </div>
              <p className="text-sm leading-relaxed max-w-xs">
                Le registre numérique qui remplace le carnet papier dans vos points Mobile Money — pour les opérateurs en Côte d'Ivoire et en Afrique de l'Ouest.
              </p>
              <div className="flex gap-3 mt-4">
                {['f', 'in', 'tw'].map(s => (
                  <div key={s} className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center text-xs font-bold hover:bg-gray-700 cursor-pointer transition-colors text-gray-300">
                    {s}
                  </div>
                ))}
              </div>
            </div>

            {/* Links */}
            {[
              {
                titre: 'Produit',
                liens: ['Fonctionnalités', 'Tarifs', 'Feuille de route', 'Changelog'],
              },
              {
                titre: 'Support',
                liens: ['Documentation', 'FAQ', 'Contact', 'Statut'],
              },
              {
                titre: 'Légal',
                liens: ['Conditions d\'utilisation', 'Confidentialité', 'Cookies'],
              },
            ].map(col => (
              <div key={col.titre}>
                <h4 className="text-sm font-semibold text-gray-200 mb-3">{col.titre}</h4>
                <ul className="space-y-2">
                  {col.liens.map(l => (
                    <li key={l}>
                      <a href="#" className="text-sm hover:text-white transition-colors">{l}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <p>© 2026 SikaPoints. Tous droits réservés.</p>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-white transition-colors">Conditions d'utilisation</a>
              <a href="#" className="hover:text-white transition-colors">Confidentialité</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}
