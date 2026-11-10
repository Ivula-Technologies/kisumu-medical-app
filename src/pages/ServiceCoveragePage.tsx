import { useState } from 'react'
import {
  coverageIndicators,
  coverageSummary,
  subCountyCoverage,
  type CoverageGap,
  type CoverageIndicatorId,
  type GapStatus,
} from '../services/serviceCoverageData'
import { generateCoverageGapBrief } from '../services/groqService'
import { Sparkline } from '../components/charts'
import { AiOutput, Dot, Icon, KpiStrip, Notice, Panel, Pill } from '../components/ui'
import type { Tone } from '../utils/tone'

const STATUSES: GapStatus[] = ['Unreviewed', 'Outreach planned', 'Resolved']

const indicatorById = Object.fromEntries(coverageIndicators.map((i) => [i.id, i])) as Record<
  CoverageIndicatorId,
  (typeof coverageIndicators)[number]
>

/** Points below target: at target is fine, under 10 needs watching, 20 or more is critical. */
function gapTone(value: number, target: number): Tone {
  const shortfall = target - value
  if (shortfall <= 0) return 'ok'
  if (shortfall < 10) return 'moderate'
  if (shortfall < 20) return 'high'
  return 'critical'
}

/** County coverage, weighted by households so large sub-counties count for more. */
function countyCoverage(id: CoverageIndicatorId): number {
  const total = subCountyCoverage.reduce((sum, sc) => sum + sc.households, 0)
  return subCountyCoverage.reduce((sum, sc) => sum + sc.coverage[id] * sc.households, 0) / total
}

interface Props {
  gaps: CoverageGap[]
  onStatusChange: (id: string, status: GapStatus) => void
  onAskCopilot: () => void
}

export function ServiceCoveragePage({ gaps, onStatusChange, onAskCopilot }: Props) {
  const [briefs, setBriefs] = useState<Record<string, string>>({})
  const [analyzing, setAnalyzing] = useState('')
  const [error, setError] = useState('')

  const openGaps = gaps.filter((g) => g.status !== 'Resolved')
  const householdsAffected = openGaps.reduce((sum, g) => sum + g.households, 0)

  const generateBrief = async (gap: CoverageGap) => {
    const indicator = indicatorById[gap.indicator]
    setAnalyzing(gap.id)
    setError('')
    try {
      const brief = await generateCoverageGapBrief({
        indicator: indicator.name,
        subCounty: gap.subCounty,
        area: gap.area,
        coverage: gap.coverage,
        target: indicator.target,
        recent: gap.recent,
        communityUnits: gap.communityUnits,
        households: gap.households,
        whyFlagged: gap.whyFlagged,
      })
      setBriefs((prev) => ({ ...prev, [gap.id]: brief }))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setAnalyzing('')
    }
  }

  return (
    <>
      <Notice>
        Coverage gaps are flagged from aggregated eCHIS and KHIS data for {coverageSummary.period}. County teams decide
        where outreach goes. No household or patient is identified.
      </Notice>

      <KpiStrip
        label="County service coverage"
        items={[
          {
            label: 'Open coverage gaps',
            value: openGaps.length,
            note: `${householdsAffected.toLocaleString()} households affected`,
            detail: `${gaps.filter((g) => g.status === 'Unreviewed').length} awaiting review`,
          },
          ...coverageIndicators.map((indicator) => {
            const value = countyCoverage(indicator.id)
            const below = subCountyCoverage.filter((sc) => sc.coverage[indicator.id] < indicator.target).length
            return {
              label: indicator.name,
              value: value.toFixed(1),
              unit: '%',
              meter: { value, tone: gapTone(value, indicator.target) },
              note: `Target ${indicator.target}%`,
              detail: `${below} of ${subCountyCoverage.length} sub-counties below target`,
            }
          }),
        ]}
      />

      <div className="grid grid-main">
        <Panel
          eyebrow="Coverage by sub-county"
          title="Where services fall short of target"
          flush
          aside={<span className="tag">{coverageSummary.period}</span>}
          footer={
            <div className="legend">
              <span className="legend-item">
                <span className="legend-swatch tone-ok" /> At or above target
              </span>
              <span className="legend-item">
                <span className="legend-swatch tone-moderate" /> Under 10 points below
              </span>
              <span className="legend-item">
                <span className="legend-swatch tone-high" /> 10 to 19 below
              </span>
              <span className="legend-item">
                <span className="legend-swatch tone-critical" /> 20 or more below
              </span>
            </div>
          }
        >
          <div className="table-wrap">
            <table className="table heat">
              <thead>
                <tr>
                  <th>Sub-county</th>
                  {coverageIndicators.map((indicator) => (
                    <th key={indicator.id} className="c" title={indicator.description}>
                      {indicator.short}
                      <span className="cell-sub">Target {indicator.target}%</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {subCountyCoverage.map((sc) => (
                  <tr key={sc.subCounty}>
                    <th scope="row">{sc.subCounty}</th>
                    {coverageIndicators.map((indicator) => {
                      const value = sc.coverage[indicator.id]
                      return (
                        <td key={indicator.id} className="c">
                          <span
                            className={`heat-cell num tone-${gapTone(value, indicator.target)}`}
                            title={`${indicator.name}: ${value}% against a target of ${indicator.target}%`}
                          >
                            {value}%
                          </span>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel eyebrow="Community reach" title="Households per promoter" flush>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Sub-county</th>
                  <th className="r">Households</th>
                  <th className="r">Units</th>
                  <th className="r">CHPs</th>
                  <th className="r">Per CHP</th>
                </tr>
              </thead>
              <tbody>
                {subCountyCoverage.map((sc) => (
                  <tr key={sc.subCounty}>
                    <th scope="row">{sc.subCounty}</th>
                    <td className="r num">{sc.households.toLocaleString()}</td>
                    <td className="r num">{sc.communityUnits}</td>
                    <td className="r num">{sc.chps}</td>
                    <td className="r num">{Math.round(sc.households / sc.chps)}</td>
                  </tr>
                ))}
                <tr className="total">
                  <th scope="row">County</th>
                  <td className="r num">{coverageSummary.households.toLocaleString()}</td>
                  <td className="r num">{coverageSummary.communityUnits}</td>
                  <td className="r num">{coverageSummary.chps.toLocaleString()}</td>
                  <td className="r num">{Math.round(coverageSummary.households / coverageSummary.chps)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      <Panel
        eyebrow="Priority gaps"
        title="Community unit clusters to review"
        flush
        aside={
          <>
            <span className="tag">{openGaps.length} open</span>
            <button type="button" className="btn btn-sm" onClick={onAskCopilot}>
              Discuss with copilot
            </button>
          </>
        }
      >
        <ul className="rows">
          {gaps.map((gap) => {
            const indicator = indicatorById[gap.indicator]
            const change = gap.recent[gap.recent.length - 1] - gap.recent[0]
            return (
              <li key={gap.id} className="gap">
                <div className="gap-head">
                  <Dot tone={gapTone(gap.coverage, indicator.target)} />
                  <div className="row-main">
                    <p className="row-title">
                      {indicator.name} · {gap.area}
                    </p>
                    <p className="row-meta">
                      <span className="mono">{gap.id}</span> · {gap.subCounty} · {gap.communityUnits} community units ·{' '}
                      {gap.households.toLocaleString()} households
                    </p>
                  </div>
                  <div className="gap-figures">
                    <span className="row-figure num">
                      {gap.coverage}% <span className="muted">of {indicator.target}%</span>
                    </span>
                    <span className={change < 0 ? 'delta bad num' : 'delta good num'}>
                      {change < 0 ? '−' : '+'}
                      {Math.abs(change)} pts in 3 months
                    </span>
                  </div>
                </div>

                <div className="gap-body">
                  <div>
                    <p className="field-label">Why flagged</p>
                    <p className="row-text">{gap.whyFlagged}</p>
                  </div>
                  <div>
                    <p className="field-label">Suggested action</p>
                    <p className="row-text">{gap.suggestedAction}</p>
                  </div>
                </div>

                <div className="gap-foot">
                  <Pill>{gap.status}</Pill>
                  <label className="sr-only" htmlFor={`gap-status-${gap.id}`}>
                    Review state for {gap.id}
                  </label>
                  <select
                    id={`gap-status-${gap.id}`}
                    className="input gap-select"
                    value={gap.status}
                    onChange={(e) => onStatusChange(gap.id, e.target.value as GapStatus)}
                  >
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => generateBrief(gap)}
                    disabled={analyzing !== ''}
                  >
                    <Icon name="assistant" size={14} />
                    {analyzing === gap.id ? 'Drafting…' : 'Draft AI outreach brief'}
                  </button>
                </div>

                {briefs[gap.id] ? (
                  <AiOutput title={`Outreach brief — ${gap.id}`} requirement="Requires sub-county team approval">
                    {briefs[gap.id]}
                  </AiOutput>
                ) : null}
              </li>
            )
          })}
        </ul>
        {error ? (
          <p className="form-error form-error-inset" role="alert">
            Could not draft the brief: {error}
          </p>
        ) : null}
      </Panel>

      <div className="grid grid-2">
        <Panel eyebrow="County trend" title="Coverage over six months">
          <div className="spark-grid spark-grid-2">
            {coverageIndicators.map((indicator) => {
              const first = indicator.trend[0]
              const latest = indicator.trend[indicator.trend.length - 1]
              const change = latest - first
              return (
                <div key={indicator.id} className="spark-cell">
                  <p className="spark-label">{indicator.name}</p>
                  <p className="spark-value num">
                    {latest}%
                    <span className={change < 0 ? 'delta bad' : 'delta good'}>
                      {change < 0 ? '−' : '+'}
                      {Math.abs(change)}
                    </span>
                  </p>
                  <Sparkline values={indicator.trend} label={`${indicator.name}: ${first}% to ${latest}% over six months`} />
                  <p className="spark-range num">
                    <span>May</span>
                    <span>Oct</span>
                  </p>
                </div>
              )
            })}
          </div>
        </Panel>

        <Panel eyebrow="Method" title="How gaps are flagged">
          <ul className="checklist">
            <li>Coverage is services delivered divided by the expected eligible population for the month.</li>
            <li>
              A cluster of community units is flagged when coverage is 10 or more points below target, or has fallen
              for three months in a row.
            </li>
            <li>Household visits come from eCHIS. Antenatal, delivery and immunisation figures come from KHIS.</li>
            <li>Data are aggregated to community unit level. Suggested actions need sub-county team approval.</li>
          </ul>
        </Panel>
      </div>
    </>
  )
}
