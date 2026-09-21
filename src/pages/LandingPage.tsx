import { Link } from 'react-router-dom'

const FEATURES = [
  {
    title: 'Ouverture',
    desc: 'Ouvre des caisses & capsules en ×1, ×5 ou ×10 avec roulette animée.',
    icon: '🎁',
  },
  {
    title: 'Inventaire',
    desc: 'Conserve tes drops simulés localement, inspecte et gère ta collection.',
    icon: '🎒',
  },
  {
    title: 'Marché',
    desc: 'Enchères $SIM simulées, bots et courbe de prix — zéro argent réel.',
    icon: '📈',
  },
  {
    title: 'Collections',
    desc: 'Albums, défis / badges et trade-up contract pour progresser.',
    icon: '🏆',
  },
]

export function LandingPage({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <div className="space-y-12 sm:space-y-16 py-4 sm:py-8">
      <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-panel via-panel-2 to-[#0a0d12] px-6 py-12 sm:px-12 sm:py-16 shadow-xl shadow-black/40">
        <div
          className="pointer-events-none absolute -top-24 -right-16 h-64 w-64 rounded-full opacity-30 blur-3xl"
          style={{
            background:
              'radial-gradient(circle, #d4a01766 0%, transparent 70%)',
          }}
          aria-hidden
        />
        <div className="relative max-w-2xl space-y-5">
          <p className="text-xs uppercase tracking-[0.2em] text-accent font-semibold">
            Skin Csgo · Simulateur CS2
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-tight">
            Ouvre des caisses Counter-Strike —{' '}
            <span className="text-accent">gratuitement</span>
          </h1>
          <p className="text-muted text-sm sm:text-base leading-relaxed">
            Simulateur d&apos;ouverture de caisses, capsules et packages.
            Inventaire, marché aux enchères et collections — 100&nbsp;%
            fictif, sans argent réel.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            {isLoggedIn ? (
              <Link
                to="/caisses"
                className="inline-flex items-center justify-center rounded-lg bg-accent text-bg font-bold px-6 py-3 text-sm hover:brightness-110 transition shadow-lg shadow-accent/25"
              >
                Entrer dans le simulateur
              </Link>
            ) : (
              <>
                <Link
                  to="/auth"
                  className="inline-flex items-center justify-center rounded-lg bg-accent text-bg font-bold px-6 py-3 text-sm hover:brightness-110 transition shadow-lg shadow-accent/25"
                >
                  Inscription / Connexion
                </Link>
                <Link
                  to="/auth?mode=login"
                  className="inline-flex items-center justify-center rounded-lg border border-border bg-panel/60 px-6 py-3 text-sm font-semibold text-text hover:border-accent/50 hover:text-accent transition"
                >
                  J&apos;ai déjà un compte
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-xl font-bold tracking-tight">Fonctionnalités</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-border bg-panel p-5 hover:border-accent/40 transition"
            >
              <div className="text-2xl mb-2" aria-hidden>
                {f.icon}
              </div>
              <h3 className="font-semibold text-accent mb-1">{f.title}</h3>
              <p className="text-sm text-muted leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-covert/40 bg-covert/5 px-5 py-4 text-sm text-muted leading-relaxed">
        <p className="font-semibold text-covert mb-1">Disclaimer</p>
        <p>
          Simulateur gratuit à but éducatif / divertissement. Aucun skin
          réel, aucun argent réel, aucun dépôt. Non affilié à Valve, Steam
          ou Counter-Strike. Les marques appartiennent à leurs propriétaires.
        </p>
      </section>
    </div>
  )
}
