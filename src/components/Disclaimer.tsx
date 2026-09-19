export function Disclaimer({ compact = false }: { compact?: boolean }) {
  return (
    <p
      className={
        compact
          ? 'text-center text-[11px] text-muted leading-snug px-2'
          : 'text-center text-xs sm:text-sm text-muted bg-panel/80 border border-border rounded-lg px-3 py-2'
      }
    >
      Simulateur gratuit — aucun skin réel, aucun argent réel. Non affilié à
      Valve / Steam / Counter-Strike.
    </p>
  )
}
