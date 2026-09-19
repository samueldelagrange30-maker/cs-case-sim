import { useEffect, useState } from 'react'

export function Countdown({ endsAt }: { endsAt: number }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const left = Math.max(0, endsAt - now)
  if (left <= 0) {
    return <span className="text-covert font-mono text-xs">Terminé</span>
  }
  const s = Math.floor(left / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const urgent = left < 60_000
  const label =
    h > 0
      ? `${h}h ${String(m).padStart(2, '0')}m ${String(sec).padStart(2, '0')}s`
      : m > 0
        ? `${m}m ${String(sec).padStart(2, '0')}s`
        : `${sec}s`
  return (
    <span
      className={`font-mono text-xs ${urgent ? 'text-covert animate-pulse' : 'text-accent'}`}
    >
      {label}
    </span>
  )
}
