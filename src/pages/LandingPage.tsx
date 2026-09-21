import { Link } from 'react-router-dom'
import {
  AmbientOrbs,
  SkinCollage,
  SkinStrip,
} from '../components/SkinShowcase'
import { ExtraordinaryShowcase } from '../components/ExtraordinaryShowcase'
import {
  EXTRAORDINARY_360,
  HERO_SKINS,
  ICONIC_SKINS,
} from '../lib/iconicSkins'

const FEATURES = [
  {
    title: 'Ouverture',
    desc: 'Ouvre des caisses & capsules en ×1, ×5 ou ×10 avec roulette animée.',
    icon: '🎁',
    accent: 'from-accent/20 to-transparent',
  },
  {
    title: 'Inventaire',
    desc: 'Conserve tes drops simulés localement, inspecte et gère ta collection.',
    icon: '🎒',
    accent: 'from-milspec/20 to-transparent',
  },
  {
    title: 'Marché',
    desc: 'Enchères $SIM simulées, bots et courbe de prix — zéro argent réel.',
    icon: '📈',
    accent: 'from-restricted/20 to-transparent',
  },
  {
    title: 'Collections',
    desc: 'Albums, défis / badges et trade-up contract pour progresser.',
    icon: '🏆',
    accent: 'from-covert/20 to-transparent',
  },
]

export function LandingPage({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <div className="space-y-12 sm:space-y-16 py-4 sm:py-8">
      <section className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-panel via-[#0f1520] to-[#080a0e] px-6 py-12 sm:px-10 sm:py-16 shadow-2xl shadow-black/50 min-h-[22rem] sm:min-h-[26rem]">
        <AmbientOrbs />
        <div className="hidden md:block absolute inset-y-0 right-0 w-[48%] opacity-90">
          <SkinCollage skins={HERO_SKINS} />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0f1520] via-[#0f1520]/40 to-transparent" />
        </div>

        <div className="relative z-10 max-w-xl space-y-5">
          <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-accent font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px_#d4a017]" />
            Skin Csgo · Simulateur CS2
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-[1.15]">
            Ouvre des caisses Counter-Strike —{' '}
            <span className="bg-gradient-to-r from-accent via-[#f0c14b] to-covert bg-clip-text text-transparent">
              gratuitement
            </span>
          </h1>
          <p className="text-muted text-sm sm:text-base leading-relaxed max-w-md">
            Simulateur d&apos;ouverture de caisses, capsules et packages.
            Inventaire, marché aux enchères et collections — 100&nbsp;%
            fictif, sans argent réel.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            {isLoggedIn ? (
              <Link
                to="/caisses"
                className="inline-flex items-center justify-center rounded-lg bg-accent text-bg font-bold px-6 py-3 text-sm hover:brightness-110 transition shadow-lg shadow-accent/30"
              >
                Entrer dans le simulateur
              </Link>
            ) : (
              <>
                <Link
                  to="/auth"
                  className="inline-flex items-center justify-center rounded-lg bg-accent text-bg font-bold px-6 py-3 text-sm hover:brightness-110 transition shadow-lg shadow-accent/30"
                >
                  Inscription / Connexion
                </Link>
                <Link
                  to="/auth?mode=login"
                  className="inline-flex items-center justify-center rounded-lg border border-border/80 bg-panel/50 backdrop-blur px-6 py-3 text-sm font-semibold text-text hover:border-accent/50 hover:text-accent transition"
                >
                  J&apos;ai déjà un compte
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="relative z-10 mt-10 md:hidden">
          <SkinStrip skins={HERO_SKINS.slice(0, 6)} />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight">
              Extraordinaires en 360°
            </h2>
            <p className="text-sm text-muted mt-1">
              Couteaux, gants et Covert cultes — rotation automatique SkinHub.
            </p>
          </div>
        </div>
        <ExtraordinaryShowcase skins={EXTRAORDINARY_360} />
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Skins emblématiques</h2>
            <p className="text-sm text-muted mt-1">
              Les finitions cultes que tu peux croiser en ouvrant des caisses.
            </p>
          </div>
        </div>
        <SkinStrip skins={ICONIC_SKINS} />
      </section>

      <section className="space-y-6">
        <h2 className="text-xl font-bold tracking-tight">Fonctionnalités</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className={`relative overflow-hidden rounded-xl border border-border bg-panel p-5 hover:border-accent/40 transition group`}
            >
              <div
                className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${f.accent} opacity-60 group-hover:opacity-90 transition`}
              />
              <div className="relative">
                <div className="text-2xl mb-2" aria-hidden>
                  {f.icon}
                </div>
                <h3 className="font-semibold text-accent mb-1">{f.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-covert/40 bg-gradient-to-br from-covert/10 via-panel to-panel px-5 py-4 text-sm text-muted leading-relaxed">
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
