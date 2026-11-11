import { useState } from 'react'
import { overviewData, type CountyAlert } from '../services/overviewData'
import { diseaseTrendSummary } from '../services/diseaseSignalsData'
import { AreaChart } from '../components/charts'
import { AnimatedCounter } from '../components/RealtimeWidgets'
import { Dot, Facts, KpiStrip, Panel, Pill } from '../components/ui'
import { toneOf } from '../utils/tone'

/* Sub-counties placed roughly where they sit around the Winam Gulf:
   Seme and Kisumu West to the west, the city in the middle, Nyando and
   Muhoroni to the east, Nyakach on the southern shore. */
const MAP_POSITIONS: Record<string, string> = {
  'Kisumu West': 'a',
  'Kisumu East': 'b',
  Muhoroni: 'c',
  Seme: 'd',
  'Kisumu Central': 'e',
  Nyando: 'f',
  Nyakach: 'g',
}

function CountyTile({ county, onOpen }: { county: CountyAlert; onOpen: () => void }) {
  return (
    <button
      type="button"
      className={`map-tile tone-${toneOf(county.alertLevel)}`}
      style={{ gridArea: MAP_POSITIONS[county.name] }}
      onClick={onOpen}
      title={`Open disease signals — ${county.name}`}
    >
      <span className="map-tile-name">{county.name}</span>
      <span className="map-tile-index num">{county.riskIndex}</span>
      <span className="map-tile-meta">
        <span className="map-tile-level">{county.alertLevel}</span>
        <span className="num">{county.trend}</span>
      </span>
    </button>
  )
}

export function OverviewPage({ onOpenSignals }: { onOpenSignals: () => void }) {
  const [showAll, setShowAll] = useState(false)
  const [disease, setDisease] = useState('All')
  const weeks = diseaseTrendSummary[0].weeklyCounts.map((_, i) => `W${35 + i}`)
  const trend =
    disease === 'All'
      ? weeks.map((_, i) => diseaseTrendSummary.reduce((sum, d) => sum + d.weeklyCounts[i], 0))
      : (diseaseTrendSummary.find((d) => d.disease === disease) ?? diseaseTrendSummary[0]).weeklyCounts
  const trendChange = Math.round(((trend[trend.length - 1] - trend[0]) / trend[0]) * 100)
  const { metrics, subCounties, latestAlerts, facilitySnapshot } = overviewData
  const alerts = showAll ? latestAlerts : latestAlerts.slice(0, 4)
  const reportingPct = (metrics.reportingThisWeek / metrics.totalFacilities) * 100

  return (
    <>
      <KpiStrip
        label="Overview metrics"
        items={[
          {
            label: 'Facilities reporting',
            value: <AnimatedCounter target={metrics.reportingThisWeek} />,
            unit: `/ ${metrics.totalFacilities}`,
            meter: { value: reportingPct, tone: 'brand' },
            note: `${reportingPct.toFixed(1)}% this week`,
            detail: '+4.2% vs previous week',
          },
          {
            label: 'Data completeness',
            value: <AnimatedCounter target={metrics.completeness} decimals={1} />,
            unit: '%',
            meter: { value: metrics.completeness, tone: 'brand' },
            note: 'Quality threshold met',
            detail: '+1.1 points',
          },
          {
            label: 'Reporting timeliness',
            value: <AnimatedCounter target={metrics.timeliness} decimals={1} />,
            unit: '%',
            meter: { value: metrics.timeliness, tone: 'brand' },
            note: 'Within expected window',
            detail: 'Target 90%',
          },
          {
            label: 'Open alerts',
            value: <AnimatedCounter target={metrics.openAlerts} />,
            meter: { value: metrics.openAlerts, max: 20, tone: 'high' },
            note: '12 active investigations',
            detail: '5 require escalation',
          },
          {
            label: 'Facilities at stockout risk',
            value: <AnimatedCounter target={metrics.stockoutRisk} />,
            meter: { value: metrics.stockoutRisk, max: 20, tone: 'critical' },
            note: 'Risk threshold reviewed',
            detail: '3 facilities flagged red',
          },
        ]}
      />

      <div className="grid grid-main">
        <Panel
          eyebrow="Reported cases"
          title="Priority diseases, last 8 weeks"
          aside={
            <label>
              <span className="sr-only">Disease</span>
              <select id="overview-disease" className="input input-sm" value={disease} onChange={(e) => setDisease(e.target.value)}>
                <option value="All">All five diseases</option>
                {diseaseTrendSummary.map((d) => (
                  <option key={d.disease} value={d.disease}>
                    {d.disease}
                  </option>
                ))}
              </select>
            </label>
          }
        >
          <p className="chart-headline">
            <span className="num">{trend[trend.length - 1].toLocaleString()}</span> cases in week 42
            <span className={trendChange > 0 ? 'delta bad' : 'delta good'}>
              {trendChange > 0 ? '+' : '−'}
              {Math.abs(trendChange)}% since week 35
            </span>
          </p>
          <AreaChart
            values={trend}
            labels={weeks}
            label={`Weekly reported cases, ${disease === 'All' ? 'all five priority diseases' : disease}, weeks 35 to 42`}
          />
        </Panel>

        <Panel
          eyebrow="Latest alerts"
          title="Signals requiring review"
          flush
          aside={
            latestAlerts.length > 4 ? (
              <button type="button" className="btn btn-quiet btn-sm" onClick={() => setShowAll((v) => !v)}>
                {showAll ? 'Show fewer' : `View all ${latestAlerts.length}`}
              </button>
            ) : null
          }
        >
          <ul className="rows">
            {alerts.map((alert) => (
              <li key={alert.id} className="row">
                <Dot tone={toneOf(alert.level)} />
                <div className="row-main">
                  <p className="row-title">{alert.title}</p>
                  <p className="row-meta">
                    <span className="mono">{alert.id}</span> · {alert.subCounty} · {alert.disease} · {alert.age}
                  </p>
                </div>
                <div className="row-side">
                  <Pill>{alert.state}</Pill>
                  <span className="row-figure num">
                    {alert.count} <span className="muted">vs {alert.threshold}</span>
                  </span>
                  <span className="row-meta">{alert.officer}</span>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="grid grid-main">
        <Panel
          eyebrow="Sub-county risk"
          title="Alert intensity by area"
          aside={<span className="tag">{subCounties.length} sub-counties</span>}
          footer={
            <div className="legend">
              {(['low', 'moderate', 'high', 'critical'] as const).map((level) => (
                <span key={level} className="legend-item">
                  <span className={`legend-swatch tone-${toneOf(level)}`} />
                  {level[0].toUpperCase() + level.slice(1)}
                </span>
              ))}
              <span className="legend-note">
                Risk index 0–100 from weekly IDSR thresholds. Trend vs prior month. Schematic layout, not to scale.
              </span>
            </div>
          }
        >
          <div className="county-map" aria-label="Schematic map of Kisumu sub-counties">
            {subCounties.map((county) => (
              <CountyTile key={county.name} county={county} onOpen={onOpenSignals} />
            ))}
            <div className="map-lake" aria-hidden="true">
              <span>Lake Victoria</span>
              <small>Winam Gulf</small>
            </div>
          </div>
        </Panel>

        <div className="stack">
          <Panel eyebrow="Synthetic dataset" title="Demo coverage">
            <Facts
              items={[
                { label: 'Total facilities', value: facilitySnapshot.totalFacilities.toLocaleString() },
                { label: 'Government-owned', value: facilitySnapshot.governmentOwned.toLocaleString() },
                { label: 'Community units', value: facilitySnapshot.communityUnits.toLocaleString() },
                { label: 'Health promoters', value: facilitySnapshot.chps.toLocaleString() },
                { label: 'Households served', value: facilitySnapshot.households.toLocaleString() },
              ]}
            />
          </Panel>

          <Panel eyebrow="Data governance" title="AI labels and controls">
            <ul className="checklist">
              <li>Routine facility and community data remain in eCHIS, KenyaEMR and KHIS.</li>
              <li>AI outputs are labelled, logged and require human confirmation before action.</li>
              <li>Only aggregated, non-patient-level data are used in the demo.</li>
            </ul>
          </Panel>
        </div>
      </div>
    </>
  )
}
