import { useMemo } from 'react'

export interface ChartPoint {
  at: number
  value: number
  label?: string
}

interface Props {
  points: ChartPoint[]
  height?: number
  className?: string
  title?: string
  valueSuffix?: string
}

export function SalesChart({
  points,
  height = 180,
  className = '',
  title,
  valueSuffix = ' $SIM',
}: Props) {
  const sorted = useMemo(
    () => [...points].sort((a, b) => a.at - b.at),
    [points],
  )

  if (sorted.length === 0) {
    return (
      <div
        className={`rounded-lg border border-border bg-panel flex items-center justify-center text-sm text-muted ${className}`}
        style={{ height }}
      >
        Pas encore de données de vente pour cet item.
      </div>
    )
  }

  const pad = { top: 16, right: 12, bottom: 28, left: 44 }
  const width = 560
  const innerW = width - pad.left - pad.right
  const innerH = height - pad.top - pad.bottom

  const values = sorted.map((p) => p.value)
  const minV = Math.min(...values)
  const maxV = Math.max(...values)
  const spanV = Math.max(1, maxV - minV)
  const minT = sorted[0]!.at
  const maxT = sorted[sorted.length - 1]!.at
  const spanT = Math.max(1, maxT - minT)

  const coords = sorted.map((p) => {
    const x = pad.left + ((p.at - minT) / spanT) * innerW
    const y = pad.top + (1 - (p.value - minV) / spanV) * innerH
    return { x, y, ...p }
  })

  const path = coords
    .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
    .join(' ')

  const area =
    path +
    ` L ${coords[coords.length - 1]!.x.toFixed(1)} ${(pad.top + innerH).toFixed(1)}` +
    ` L ${coords[0]!.x.toFixed(1)} ${(pad.top + innerH).toFixed(1)} Z`

  const yTicks = [minV, minV + spanV / 2, maxV]
  const fmtDate = (t: number) =>
    new Date(t).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })

  return (
    <div className={`rounded-lg border border-border bg-panel p-3 ${className}`}>
      {title && (
        <h3 className="text-sm font-semibold mb-2 text-text">{title}</h3>
      )}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        role="img"
        aria-label={title ?? 'Courbe des prix'}
      >
        <defs>
          <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d4a017" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#d4a017" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {/* grid */}
        {yTicks.map((v, i) => {
          const y = pad.top + (1 - (v - minV) / spanV) * innerH
          return (
            <g key={i}>
              <line
                x1={pad.left}
                x2={width - pad.right}
                y1={y}
                y2={y}
                stroke="#2a3444"
                strokeDasharray="3 3"
              />
              <text
                x={pad.left - 6}
                y={y + 3}
                textAnchor="end"
                fill="#8b97a8"
                fontSize="10"
              >
                {Math.round(v)}
              </text>
            </g>
          )
        })}
        <path d={area} fill="url(#salesFill)" />
        <path
          d={path}
          fill="none"
          stroke="#d4a017"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {coords.map((c, i) => (
          <circle
            key={i}
            cx={c.x}
            cy={c.y}
            r={sorted.length === 1 ? 4 : 3}
            fill="#d4a017"
            stroke="#12171f"
            strokeWidth="1"
          >
            <title>
              {c.value}
              {valueSuffix} — {fmtDate(c.at)}
            </title>
          </circle>
        ))}
        <text
          x={pad.left}
          y={height - 8}
          fill="#8b97a8"
          fontSize="10"
        >
          {fmtDate(minT)}
        </text>
        <text
          x={width - pad.right}
          y={height - 8}
          textAnchor="end"
          fill="#8b97a8"
          fontSize="10"
        >
          {fmtDate(maxT)}
        </text>
      </svg>
      {sorted.length === 1 && (
        <p className="text-[11px] text-muted mt-1">
          Une seule vente — la courbe s&apos;enrichira avec d&apos;autres
          transactions.
        </p>
      )}
    </div>
  )
}
