import {
  overallPilotStatus,
  pilotIndicators,
  pilotMESummary,
  pilotTrendData,
  subCountyPilotPerformance,
  type PilotIndicator,
} from '../services/pilotMEData'
import { Sparkline } from '../components/charts'
import { Facts, Panel, Pill } from '../components/ui'
import { toneOf } from '../utils/tone'

const TREND_META: Record<keyof typeof pilotTrendData, { label: string; unit: string; lowerIsBetter?: boolean }> = {
  timeliness: { label: 'Reporting timeliness', unit: '%' },
  completeness: { label: 'Data completeness', unit: '%' },
  verificationTime: { label: 'Alert verification time', unit: ' h', lowerIsBetter: true },
  mape: { label: 'Forecast error (MAPE)', unit: '%', lowerIsBetter: true },
  activeUsers: { label: 'Weekly active users', unit: '' },
  signalActionRate: { label: 'Signals acted on', unit: '%' },
  stockoutPrevention: { label: 'Stockouts prevented', unit: '%' },
  coverageGapResponse: { label: 'Coverage gaps with outreach planned', unit: '%' },
}

function format(value: number | string, unit: string): string {
  if (typeof value !== 'number') return String(value)
  return unit === '%' ? value.toFixed(1) : String(value)
}

/** How far the indicator has moved from baseline toward target, 0–100. Works for falling targets too. */
function progress(indicator: PilotIndicator): number | null {
  const current = Number(indicator.currentValue)
  const baseline = Number(indicator.baselineValue)
  const target = Number(indicator.targetValue)
  if ([current, baseline, target].some(Number.isNaN) || target === baseline) return null
  return Math.max(0, Math.min(((current - baseline) / (target - baseline)) * 100, 100))
}

function IndicatorCard({ indicator }: { indicator: PilotIndicator }) {
  const pct = progress(indicator)
  const unit = indicator.unit === '%' ? '%' : ` ${indicator.unit}`
  return (
    <article className="indicator">
      <header className="indicator-head">
        <span className="mono muted">{indicator.id}</span>
        <Pill>{indicator.status}</Pill>
      </header>
      <h3>{indicator.name}</h3>
      <p className="indicator-value num">
        {format(indicator.currentValue, indicator.unit)}
        <span className="kpi-unit">{indicator.unit}</span>
      </p>
      {pct !== null ? (
        <div className="track" aria-label={`${Math.round(pct)}% of the way from baseline to target`}>
          <div className={`track-fill tone-${toneOf(indicator.status)}`} style={{ width: `${pct}%` }} />
        </div>
      ) : null}
      <div className="track-ends">
        <span>
          Baseline <span className="num">{format(indicator.baselineValue, indicator.unit)}{unit}</span>
        </span>
        <span>
          Target <span className="num">{indicator.targetValue}{unit}</span>
        </span>
      </div>
      <p className="indicator-desc">{indicator.description}</p>
    </article>
  )
}

export function PilotMEPage() {
  const atRisk = pilotIndicators.filter((i) => i.status !== 'On Track')
  const trends = Object.entries(pilotTrendData) as Array<[keyof typeof pilotTrendData, number[]]>

  return (
    <>
      <section className="indicator-grid" aria-label="Pilot indicators">
        {pilotIndicators.map((indicator) => (
          <IndicatorCard key={indicator.id} indicator={indicator} />
        ))}
      </section>

      <Panel
        eyebrow="Indicator trends"
        title="Weekly progress over the 8-week pilot window"
        aside={<span className="tag">{pilotMESummary.reportingPeriod}</span>}
      >
        <div className="spark-grid">
          {trends.map(([key, values]) => {
            const meta = TREND_META[key]
            const first = values[0]
            const latest = values[values.length - 1]
            const change = latest - first
            const improving = meta.lowerIsBetter ? change < 0 : change > 0
            return (
              <div key={key} className="spark-cell">
                <p className="spark-label">{meta.label}</p>
                <p className="spark-value num">
                  {latest}
                  {meta.unit}
                  <span className={improving ? 'delta good' : 'delta bad'}>
                    {change > 0 ? '+' : '−'}
                    {Math.abs(change).toFixed(Number.isInteger(change) ? 0 : 1)}
                  </span>
                </p>
                <Sparkline values={values} label={`${meta.label}: ${first}${meta.unit} to ${latest}${meta.unit}`} />
                <p className="spark-range num">
                  <span>W35</span>
                  <span>W42</span>
                </p>
              </div>
            )
          })}
        </div>
      </Panel>

      <Panel eyebrow="Pilot summary" title="Overall status" aside={<Pill>{overallPilotStatus()}</Pill>}>
        <Facts
          items={[
            { label: 'Active sub-counties', value: pilotMESummary.activePilotSubCounties },
            { label: 'Facilities in pilot', value: pilotMESummary.totalFacilitiesInPilot },
            { label: 'Weekly active users', value: pilotMESummary.weeklyActiveUsers },
            { label: 'Indicators on track', value: `${pilotIndicators.length - atRisk.length} / ${pilotIndicators.length}` },
          ]}
        />
        <div className="callout">
          <h3>Indicators needing attention</h3>
          <p>{atRisk.map((i) => i.name).join(', ') || 'None. Every indicator is on track.'}</p>
          <p className="callout-note">Overall status follows the weakest indicator.</p>
        </div>
      </Panel>

      <Panel eyebrow="Sub-county performance" title="Indicator breakdown by sub-county" flush>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Sub-county</th>
                <th className="r">Timeliness</th>
                <th className="r">Completeness</th>
                <th className="r">Verify time</th>
                <th className="r">MAPE</th>
                <th className="r">Active users</th>
                <th className="r">Signals acted on</th>
                <th className="r">Stockouts prevented</th>
                <th className="r">Gap response</th>
              </tr>
            </thead>
            <tbody>
              {subCountyPilotPerformance.map((sc) => (
                <tr key={sc.subCounty}>
                  <th scope="row">{sc.subCounty}</th>
                  <td className="r num">{sc.timeliness}%</td>
                  <td className="r num">{sc.completeness}%</td>
                  <td className="r num">{sc.verificationTime} h</td>
                  <td className="r num">{sc.mape}%</td>
                  <td className="r num">{sc.activeUsers}</td>
                  <td className="r num">{sc.signalActionRate}%</td>
                  <td className="r num">{sc.stockoutPrevention}%</td>
                  <td className="r num">{sc.coverageGapResponse}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  )
}
