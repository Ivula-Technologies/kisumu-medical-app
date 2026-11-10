import {
  dataQualityIssues,
  dataQualitySummary,
  facilitiesNotReporting,
  facilityReporting,
  sourceQuality,
} from '../services/dataQualityData'
import { AnimatedCounter } from '../components/RealtimeWidgets'
import { Dot, KpiStrip, Meter, Notice, Panel, Pill } from '../components/ui'
import { toneOf, type Tone } from '../utils/tone'

function errorTone(count: number): Tone {
  if (count > 10) return 'high'
  if (count > 5) return 'moderate'
  return 'ok'
}

function PercentCell({ value, target }: { value: number; target: number }) {
  return (
    <span className="percent-cell">
      <span className="num">{value}%</span>
      <Meter value={value} tone={value >= target ? 'brand' : 'moderate'} />
    </span>
  )
}

export function DataQualityPage({ lastSync }: { lastSync: string }) {
  const summary = dataQualitySummary

  return (
    <>
      <Notice>
        Quality metrics are computed from eCHIS, KenyaEMR and KHIS submissions. Facilities with validation failures are
        flagged for follow-up.
      </Notice>

      <KpiStrip
        label="Data quality overview"
        items={[
          {
            label: 'Completeness',
            value: <AnimatedCounter target={summary.overallCompleteness} decimals={1} />,
            unit: '%',
            meter: { value: summary.overallCompleteness, tone: 'brand' },
            note: 'Target 95% or higher',
            detail: '+2.1 pts vs baseline',
          },
          {
            label: 'Timeliness',
            value: <AnimatedCounter target={summary.overallTimeliness} decimals={1} />,
            unit: '%',
            meter: { value: summary.overallTimeliness, tone: 'brand' },
            note: 'Target 90% or higher',
            detail: '+4.6 pts vs baseline',
          },
          {
            label: 'Validation pass rate',
            value: <AnimatedCounter target={summary.validationPassRate} decimals={1} />,
            unit: '%',
            meter: { value: summary.validationPassRate, tone: 'brand' },
            note: `${summary.facilitiesWithIssues} facilities with issues`,
            detail: 'Down from 12 last week',
          },
          {
            label: 'Not reporting',
            value: <AnimatedCounter target={summary.facilitiesNotReporting} />,
            unit: 'facilities',
            meter: { value: summary.facilitiesNotReporting, max: 20, tone: 'critical' },
            note: 'Silent for more than 7 days',
            detail: 'Escalation initiated',
          },
          {
            label: 'Sources connected',
            value: sourceQuality.length,
            unit: `/ ${sourceQuality.length}`,
            meter: { value: 100, tone: 'ok' },
            note: 'All sources syncing',
            detail: <span className="mono">{lastSync}</span>,
          },
        ]}
      />

      <div className="grid grid-main">
        <Panel
          eyebrow="Source system health"
          title="Completeness and timeliness by source"
          flush
          aside={<span className="tag">{sourceQuality.length} sources</span>}
        >
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Source</th>
                  <th className="r">Connected</th>
                  <th className="r">Reporting</th>
                  <th>Completeness</th>
                  <th>Timeliness</th>
                  <th className="r">Errors</th>
                </tr>
              </thead>
              <tbody>
                {sourceQuality.map((src) => (
                  <tr key={src.source}>
                    <th scope="row">{src.source}</th>
                    <td className="r num">{src.facilitiesConnected}</td>
                    <td className="r num">{src.facilitiesReporting}</td>
                    <td>
                      <PercentCell value={src.completeness} target={95} />
                    </td>
                    <td>
                      <PercentCell value={src.timeliness} target={90} />
                    </td>
                    <td className="r">
                      <Pill tone={errorTone(src.validationErrors)}>{String(src.validationErrors)}</Pill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel
          eyebrow="Not reporting"
          title="Silent for more than 7 days"
          flush
          aside={<span className="tag">{facilitiesNotReporting.length} listed</span>}
        >
          <ul className="rows">
            {facilitiesNotReporting.map((fac) => (
              <li key={fac.facility} className="row">
                <Dot tone="critical" />
                <div className="row-main">
                  <p className="row-title">{fac.facility}</p>
                  <p className="row-meta">
                    {fac.subCounty} · {fac.source}
                  </p>
                </div>
                <div className="row-side">
                  <span className="row-figure">
                    <span className="num">{fac.daysSinceLastReport}</span> days
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel
        eyebrow="Open issues"
        title="Facilities requiring action"
        flush
        aside={<span className="tag">{dataQualityIssues.length} issues</span>}
      >
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Severity</th>
                <th>Facility</th>
                <th>Issue</th>
                <th>Source</th>
                <th className="r">Last report</th>
              </tr>
            </thead>
            <tbody>
              {dataQualityIssues.map((issue) => (
                <tr key={`${issue.facility}-${issue.issue}`}>
                  <td>
                    <Pill>{issue.severity}</Pill>
                  </td>
                  <th scope="row">
                    {issue.facility}
                    <span className="cell-sub">{issue.subCounty}</span>
                  </th>
                  <td className="cell-text">{issue.issue}</td>
                  <td>{issue.source}</td>
                  <td className="r nowrap">
                    <span className="num">{issue.daysSinceReport}</span> {issue.daysSinceReport === 1 ? 'day' : 'days'} ago
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel
        eyebrow="Facility reporting detail"
        title="Completeness and timeliness by facility"
        flush
        aside={<span className="tag">{facilityReporting.length} facilities shown</span>}
      >
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Facility</th>
                <th>Source</th>
                <th>Last report</th>
                <th>Completeness</th>
                <th>Timeliness</th>
                <th>Validation</th>
                <th className="r">Issues</th>
              </tr>
            </thead>
            <tbody>
              {facilityReporting.map((fac) => (
                <tr key={fac.facility}>
                  <th scope="row">
                    {fac.facility}
                    <span className="cell-sub">{fac.subCounty}</span>
                  </th>
                  <td>{fac.source}</td>
                  <td className="num">{fac.lastReport}</td>
                  <td>
                    <PercentCell value={fac.completeness} target={95} />
                  </td>
                  <td>
                    <PercentCell value={fac.timeliness} target={90} />
                  </td>
                  <td>
                    <Pill tone={toneOf(fac.validationStatus)}>{fac.validationStatus}</Pill>
                  </td>
                  <td className="r num">{fac.issuesCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  )
}
