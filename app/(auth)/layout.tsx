import Logo from '@/components/ui/logo'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden" style={{ background: '#050d1a' }}>

      {/* ── Orbes lumineux en arrière-plan ──────────────────────────────── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Orbe principal bleu */}
        <div
          className="absolute rounded-full"
          style={{
            width: 700, height: 700,
            top: '-15%', left: '-10%',
            background: 'radial-gradient(circle, rgba(37,99,235,0.35) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
        {/* Orbe indigo droite */}
        <div
          className="absolute rounded-full"
          style={{
            width: 600, height: 600,
            bottom: '-20%', right: '-10%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.30) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
        {/* Orbe cyan petit */}
        <div
          className="absolute rounded-full"
          style={{
            width: 300, height: 300,
            top: '55%', left: '60%',
            background: 'radial-gradient(circle, rgba(6,182,212,0.18) 0%, transparent 70%)',
            filter: 'blur(30px)',
          }}
        />

        {/* Grille de points */}
        <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.06 }}>
          <defs>
            <pattern id="dots" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
              <circle cx="1.5" cy="1.5" r="1.5" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>

        {/* Lignes diagonales décoratives */}
        <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.04 }} preserveAspectRatio="none">
          <line x1="0" y1="100%" x2="50%" y2="0" stroke="white" strokeWidth="1" />
          <line x1="100%" y1="100%" x2="50%" y2="0" stroke="white" strokeWidth="1" />
          <line x1="0" y1="60%" x2="100%" y2="30%" stroke="white" strokeWidth="0.5" />
        </svg>
      </div>

      {/* ── Contenu centré ───────────────────────────────────────────────── */}
      <div className="w-full max-w-md relative z-10">

        {/* Logo + accroche */}
        <div className="text-center mb-8">
          <div className="w-full bg-white rounded-2xl px-4 py-4 shadow-2xl shadow-black/30 mb-5">
            <Logo className="w-full" />
          </div>
          <p className="text-sm mt-2" style={{ color: 'rgba(148,163,184,1)' }}>
            Le registre numérique pour vos points Mobile Money
          </p>
        </div>

        {/* Carte formulaire avec bordure lumineuse */}
        <div className="relative">
          {/* Bordure gradient */}
          <div
            className="absolute -inset-px rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(37,99,235,0.5) 0%, rgba(99,102,241,0.3) 50%, rgba(6,182,212,0.2) 100%)',
              borderRadius: 18,
            }}
          />
          {/* Carte */}
          <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden">
            {children}
          </div>
        </div>

        {/* Tagline bas de page */}
        <p className="text-center mt-6 text-xs" style={{ color: 'rgba(100,116,139,1)' }}>
          Wave · Orange Money · MTN MoMo · Moov Money
        </p>
      </div>
    </div>
  )
}
