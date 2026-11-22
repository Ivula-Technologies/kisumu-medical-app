/* Charts share one rule: every mark and label is placed with the same scale. */

function niceCeil(value: number): number {
  if (value <= 0) return 1
  const magnitude = 10 ** Math.floor(Math.log10(value))
  const steps = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]
  for (const step of steps) {
    if (step * magnitude >= value) return step * magnitude
  }
  return 10 * magnitude
}

/** Small trend line with an area fill and an emphasised endpoint. */
export function Sparkline({ values, label }: { values: number[]; label: string }) {
  const W = 220
  const H = 56
  const pad = 6
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const x = (i: number) => pad + (i * (W - pad * 2)) / (values.length - 1)
  const y = (v: number) => pad + (H - pad * 2) - ((v - min) / range) * (H - pad * 2)
  const line = values.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ')
  const area = `${line} L${x(values.length - 1).toFixed(1)} ${H} L${x(0).toFixed(1)} ${H} Z`
  const last = values.length - 1

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="spark" role="img" aria-label={label} preserveAspectRatio="none">
      <path d={area} className="spark-area" />
      <path d={line} className="spark-line" fill="none" />
      <circle cx={x(last)} cy={y(values[last])} r="3.5" className="spark-end" />
    </svg>
  )
}

interface AreaChartProps {
  values: number[]
  labels: string[]
  label: string
  /** Optional second series drawn as a dark line over the area. */
  compare?: number[]
  /** Drawing width in viewBox units. Use a smaller value in narrow panels so labels stay readable. */
  width?: number
}

/** Weekly totals as a filled line, with a zero baseline so the shape is honest. */
export function AreaChart({ values, labels, label, compare, width = 720 }: AreaChartProps) {
  const W = width
  const H = 260
  const m = { top: 24, right: 24, bottom: 30, left: 44 }
  const innerW = W - m.left - m.right
  const innerH = H - m.top - m.bottom
  const yMax = niceCeil(Math.max(...values, ...(compare ?? [])) * 1.1)
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * yMax)
  const x = (i: number) => m.left + (i * innerW) / (values.length - 1)
  const y = (v: number) => m.top + innerH - (v / yMax) * innerH
  const line = values.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ')
  const area = `${line} L${x(values.length - 1).toFixed(1)} ${y(0)} L${x(0).toFixed(1)} ${y(0)} Z`
  const last = values.length - 1

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label={label}>
      <defs>
        <linearGradient id="areaFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" className="area-stop-top" />
          <stop offset="100%" className="area-stop-bottom" />
        </linearGradient>
      </defs>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={m.left} x2={m.left + innerW} y1={y(t)} y2={y(t)} className="chart-grid" />
          <text x={m.left - 10} y={y(t) + 4} textAnchor="end" className="chart-tick">
            {Number.isInteger(t) ? t : t.toFixed(1)}
          </text>
        </g>
      ))}
      <path d={area} fill="url(#areaFill)" />
      <path d={line} className="chart-line accent" fill="none" />
      {values.map((v, i) => (
        <circle key={i} cx={x(i)} cy={y(v)} r={i === last ? 5.5 : 3.5} className="chart-point accent">
          <title>{`${labels[i]}: ${v}`}</title>
        </circle>
      ))}
      {compare ? (
        <>
          <path
            d={compare.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ')}
            className="chart-line"
            fill="none"
          />
          {compare.map((v, i) => (
            <circle key={i} cx={x(i)} cy={y(v)} r={i === last ? 5 : 3} className="chart-point">
              <title>{`${labels[i]}: ${v}`}</title>
            </circle>
          ))}
          <text x={x(last)} y={y(compare[last]) + 20} textAnchor="end" className="chart-value">
            {compare[last].toLocaleString()}
          </text>
        </>
      ) : null}
      <text x={x(last)} y={y(values[last]) - 12} textAnchor="end" className="chart-value">
        {values[last].toLocaleString()}
      </text>
      {labels.map((text, i) => (
        <text key={text} x={x(i)} y={H - 8} textAnchor="middle" className="chart-tick">
          {text}
        </text>
      ))}
    </svg>
  )
}
