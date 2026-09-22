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
    desc: 'Caisses & capsules en ×1 / ×5 / ×10, roulette animée, Passer multi.',
    icon: '🎁',
  },
  {
    title: 'Inventaire',
    desc: 'Drops locaux, inspect 360°, tri & filtres — stockés dans le navigateur.',
    icon: '🎒',
  },
  {
    title: 'Marché $SIM',
    desc: 'Enchères simulées et bots. Aucun dépôt, aucun argent réel.',
    icon: '📈',
  },
  {
    title: 'Collections',
    desc: 'Albums, badges et trade-up contract pour progresser.',
    icon: '🏆',
  },
]

export function LandingPage({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <div className="space-y-10 sm:space-y-12 py-2 sm:py-4">
      {/* Above the fold */}
      <section className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-panel via-[#0f1520] to-[#080a0e] px-5 py-10 sm:px-10 sm:py-14 shadow-2xl shadow-black/50 min-h-[min(70dvh,28rem)] flex flex-col justify-center">
        <AmbientOrbs />
        <div className="hidden md:block absolute inset-y-0 right-0 w-[46%] opacity-90 pointer-events-none">
          <SkinCollage skins={HERO_SKINS} />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0f1520] via-[#0f1520]/50 to-transparent" />
        </div>

        <div className="relative z-10 max-w-xl space-y-5">
          <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-accent font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px_#d4a017]" />
            Skin Csgo · Simulateur CS2
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-[2.75rem] font-bold tracking-tight leading-[1.12] title-display">
            Ouvre des caisses Counter-Strike —{' '}
            <span className="text-accent">gratuitement</span>
          </h1>
          <p className="body-muted max-w-md text-sm sm:text-base">
            Roulette, inventaire, marché $SIM et collections. 100&nbsp;%
            fictif — probabilités honnêtes, zéro argent réel.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            {isLoggedIn ? (
              <Link to="/caisses" className="btn btn-primary btn-lg">
                Entrer dans le simulateur
              </Link>
            ) : (
              <>
                <Link to="/auth" className="btn btn-primary btn-lg">
                  Commencer
                </Link>
                <Link to="/auth?mode=login" className="btn btn-ghost btn-lg">
                  J&apos;ai déjà un compte
                </Link>
              </>
            )}
          </div>
          <p className="text-[11px] text-muted">
            Compte local (navigateur) · Non affilié à Valve / Steam
          </p>
        </div>

        <div className="relative z-10 mt-8 md:hidden">
          <SkinStrip skins={HERO_SKINS.slice(0, 5)} />
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="title-section">Extraordinaires en 360°</h2>
          <p className="body-muted mt-1">
            Un aperçu SkinHub à la fois — léger sur mobile.
          </p>
        </div>
        <ExtraordinaryShowcase skins={EXTRAORDINARY_360} />
      </section>

      <section className="space-y-3">
        <h2 className="title-section">Skins emblématiques</h2>
        <SkinStrip skins={ICONIC_SKINS} />
      </section>

      <section className="grid sm:grid-cols-2 gap-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="card p-4 sm:p-5 flex gap-3 items-start">
            <span className="text-xl shrink-0" aria-hidden>
              {f.icon}
            </span>
            <div>
              <h3 className="font-semibold text-accent text-sm">{f.title}</h3>
              <p className="text-sm text-muted mt-0.5 leading-relaxed">
                {f.desc}
              </p>
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-covert/35 bg-covert/5 px-4 py-3 text-sm text-muted leading-relaxed">
        <p className="font-semibold text-covert mb-0.5">Disclaimer</p>
        <p>
          Simulateur gratuit (éducatif / divertissement). Aucun skin réel, aucun
          argent réel. Non affilié à Valve, Steam ou Counter-Strike.
        </p>
      </section>
    </div>
  )
}
