/* Charts share one rule: every mark and label is placed with the same scale. */

function niceCeil(value: number): number {
  if (value <= 0) return 1
  const magnitude = 10 ** Math.floor(Math.log10(value))
  const steps = [1, 2, 2.5, 4, 5, 10]
  for (const step of steps) {
    if (step * magnitude >= value) return step * magnitude
  }
  return 10 * magnitude
}

interface SignalChartProps {
  values: number[]
  expectedMin: number
  expectedMax: number
  baseline: number
  /** Epidemiological week of the last value. */
  endWeek: number
  label: string
}

/** Weekly case counts against the expected range from the rolling baseline. */
export function SignalChart({ values, expectedMin, expectedMax, baseline, endWeek, label }: SignalChartProps) {
  const W = 720
  const H = 250
  const m = { top: 18, right: 124, bottom: 30, left: 40 }
  const innerW = W - m.left - m.right
  const innerH = H - m.top - m.bottom

  const yMax = niceCeil(Math.max(...values, expectedMax) * 1.08)
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * yMax)
  const x = (i: number) => m.left + (values.length === 1 ? innerW / 2 : (i * innerW) / (values.length - 1))
  const y = (v: number) => m.top + innerH - (v / yMax) * innerH

  const line = values.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ')
  const last = values.length - 1
  const startWeek = endWeek - last

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label={label}>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={m.left} x2={m.left + innerW} y1={y(t)} y2={y(t)} className="chart-grid" />
          <text x={m.left - 8} y={y(t) + 4} textAnchor="end" className="chart-tick">
            {Number.isInteger(t) ? t : t.toFixed(1)}
          </text>
        </g>
      ))}

      <rect
        x={m.left}
        y={y(expectedMax)}
        width={innerW}
        height={Math.max(y(expectedMin) - y(expectedMax), 1)}
        className="chart-band"
      />
      <line x1={m.left} x2={m.left + innerW} y1={y(baseline)} y2={y(baseline)} className="chart-baseline" />
      <text x={m.left + innerW + 8} y={y(expectedMax) + 4} className="chart-note">
        Expected {expectedMin}–{expectedMax}
      </text>
      <text x={m.left + innerW + 8} y={Math.max(y(baseline) + 4, y(expectedMax) + 18)} className="chart-note">
        Baseline {baseline}
      </text>

      <path d={line} className="chart-line" fill="none" />
      {values.map((v, i) => {
        const above = v > expectedMax
        return (
          <circle
            key={i}
            cx={x(i)}
            cy={y(v)}
            r={i === last ? 5.5 : 3.5}
            className={above ? 'chart-point above' : 'chart-point'}
          />
        )
      })}
      <text x={x(last)} y={y(values[last]) - 12} textAnchor="middle" className="chart-value">
        {values[last]}
      </text>

      {values.map((_, i) => (
        <text key={i} x={x(i)} y={H - 8} textAnchor="middle" className="chart-tick">
          W{startWeek + i}
        </text>
      ))}
    </svg>
  )
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
