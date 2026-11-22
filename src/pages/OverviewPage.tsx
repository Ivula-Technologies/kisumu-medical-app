import { useState } from 'react'
import { facilities, settlements, weeklyTrend, type Escalation } from '../services/referralData'
import { attendedAt, linkageMetrics, median, SETTLEMENTS, type Referral } from '../services/referralProtocol'
import type { Role } from '../services/roles'
import { generateLinkageBrief } from '../services/groqService'
import { AreaChart } from '../components/charts'
import { Funnel } from '../components/referral'
import { AiOutput, Icon, KpiStrip, Panel } from '../components/ui'
import { relative } from '../utils/time'

const HOUR = 3_600_000
const pct = (v: number | null) => (v === null ? '–' : `${Math.round(v)}%`)

interface Props {
  role: Role
  referrals: Referral[]
  escalations: Escalation[]
  now: Date
  onOpenEscalations: () => void
}

export function OverviewPage({ role, referrals, escalations, now, onOpenEscalations }: Props) {
  const m = linkageMetrics(referrals, now)
  const active = escalations.filter((e) => e.status === 'Awaiting clinician' || e.status === 'Clinician on the line')
  const [brief, setBrief] = useState('')
  const [drafting, setDrafting] = useState(false)
  const [error, setError] = useState('')

  const bySettlement = SETTLEMENTS.map((name) => {
    const rs = referrals.filter((r) => r.settlement === name)
    const mm = linkageMetrics(rs, now)
    const profile = settlements.find((s) => s.name === name)!
    return { name, profile, count: rs.length, mm }
  }).filter((row) => row.count > 0 || role.id === 'county')

  const byFacility = facilities
    .map((f) => {
      const rs = referrals.filter((r) => r.toFacilityId === f.id)
      const decided = rs.filter((r) => r.events.some((e) => e.kind === 'Accepted' || e.kind === 'Declined'))
      const accepted = rs.filter((r) => r.events.some((e) => e.kind === 'Accepted'))
      const hoursToDecide = decided.map((r) => {
        const e = r.events.find((x) => x.kind === 'Accepted' || x.kind === 'Declined')!
        return (new Date(e.at).getTime() - new Date(r.createdAt).getTime()) / HOUR
      })
      return { f, count: rs.length, acceptRate: decided.length ? (accepted.length / decided.length) * 100 : null, hours: median(hoursToDecide), mm: linkageMetrics(rs, now) }
    })
    .filter((row) => row.count > 0)

  const draftBrief = async () => {
    setDrafting(true)
    setError('')
    const lagging = bySettlement.filter((s) => s.mm.withinTimeframe !== null).sort((a, b) => (a.mm.withinTimeframe ?? 0) - (b.mm.withinTimeframe ?? 0))
    try {
      setBrief(
        await generateLinkageBrief([
          `${m.total} referrals in the pilot so far, ${m.open} still open`,
          `Seen within the clinical timeframe: ${pct(m.withinTimeframe)} (target 75%)`,
          `Pathway counts: ${m.funnel.map((f) => `${f.stage} ${f.count}`).join(', ')}`,
          `Awaiting acceptance: ${m.awaitingAcceptance}; overdue: ${m.overdue}; missed appointments: ${m.missed}; declined: ${m.declined}`,
          `Feedback sent to referrers for ${pct(m.feedbackClosed)} of attended referrals (target 80%)`,
          `Median time from referral to being seen: ${m.medianHoursToAttendance === null ? 'n/a' : `${(m.medianHoursToAttendance / 24).toFixed(1)} days`}`,
          `Lowest settlements for timeliness: ${lagging.slice(0, 3).map((s) => `${s.name} ${pct(s.mm.withinTimeframe)}`).join(', ')}`,
          `Facilities: ${byFacility.map((r) => `${r.f.short} received ${r.count}, accepted ${pct(r.acceptRate)}, median ${r.hours === null ? 'n/a' : Math.round(r.hours) + ' h'} to respond`).join('; ')}`,
          `Active emergency escalations: ${active.length}`,
        ]),
      )
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setDrafting(false)
    }
  }

  return (
    <>
      {active.length && role.id !== 'chp' ? (
        <button type="button" className="alert-banner" onClick={onOpenEscalations}>
          <span className="dot dot-critical pulse" aria-hidden="true" />
          <span>
            <strong>
              {active.length} emergency escalation{active.length > 1 ? 's' : ''} active.
            </strong>{' '}
            {active.map((e) => `${e.id} in ${e.settlement}, raised ${relative(e.raisedAt, now)}`).join('; ')}
          </span>
          <span className="alert-link">
            Open <Icon name="arrow" size={14} />
          </span>
        </button>
      ) : null}

      <KpiStrip
        label="Referral and linkage"
        items={[
          {
            label: 'Seen within timeframe',
            value: m.withinTimeframe === null ? '–' : Math.round(m.withinTimeframe),
            unit: m.withinTimeframe === null ? undefined : '%',
            meter: m.withinTimeframe === null ? undefined : { value: m.withinTimeframe, tone: m.withinTimeframe >= 75 ? 'ok' : 'high' },
            note: 'Target 75% or more',
            detail: 'Urgent within 3 days, routine within 14',
          },
          { label: 'Open referrals', value: m.open, note: `${m.total} since the pilot started`, detail: `${m.awaitingAcceptance} awaiting acceptance` },
          {
            label: 'Missed or overdue',
            value: m.missed + m.overdue,
            meter: { value: m.missed + m.overdue, max: Math.max(m.open, 1), tone: 'high' },
            note: `${m.missed} missed, ${m.overdue} overdue`,
            detail: `${m.declined} declined, needing redirection`,
          },
          {
            label: 'Feedback to referrer',
            value: m.feedbackClosed === null ? '–' : Math.round(m.feedbackClosed),
            unit: m.feedbackClosed === null ? undefined : '%',
            meter: m.feedbackClosed === null ? undefined : { value: m.feedbackClosed, tone: m.feedbackClosed >= 80 ? 'ok' : 'high' },
            note: 'Of attended referrals',
            detail: 'Target 80% or more',
          },
          {
            label: 'Median time to be seen',
            value: m.medianHoursToAttendance === null ? '–' : (m.medianHoursToAttendance / 24).toFixed(1),
            unit: m.medianHoursToAttendance === null ? undefined : 'days',
            note: 'From referral to attendance',
          },
        ]}
      />

      <div className="grid grid-main">
        <Panel title="Where people drop out of the pathway" eyebrow="All referrals in the pilot">
          <Funnel stages={m.funnel} />
          <p className="field-hint">Each bar counts referrals that reached that step. The red figure is the share lost since the step before.</p>
        </Panel>
        <Panel title="Referred and attended, by week" eyebrow="Last 8 weeks, synthetic">
          <AreaChart width={440} values={weeklyTrend.referred} compare={weeklyTrend.attended} labels={weeklyTrend.weeks} label="Referrals made and attended each week" />
          <div className="legend">
            <span className="legend-item">
              <span className="legend-swatch band" /> Referred
            </span>
            <span className="legend-item">
              <span className="legend-line" /> Attended
            </span>
          </div>
        </Panel>
      </div>

      <div className="grid grid-main">
        <Panel title="By settlement" eyebrow="Pilot informal settlements" flush>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Settlement</th>
                  <th className="r">Households</th>
                  <th className="r">Referrals</th>
                  <th className="r">Seen in time</th>
                  <th className="r">Median days</th>
                  <th className="r">Missed</th>
                </tr>
              </thead>
              <tbody>
                {bySettlement.map((row) => {
                  const days = median(referrals.filter((r) => r.settlement === row.name && attendedAt(r)).map((r) => (attendedAt(r)!.getTime() - new Date(r.createdAt).getTime()) / (24 * HOUR)))
                  return (
                    <tr key={row.name}>
                      <th scope="row">{row.name}</th>
                      <td className="r num">{row.profile.households.toLocaleString()}</td>
                      <td className="r num">{row.count}</td>
                      <td className="r num">{pct(row.mm.withinTimeframe)}</td>
                      <td className="r num">{days === null ? '–' : days.toFixed(1)}</td>
                      <td className="r num">{row.mm.missed || '–'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Receiving facilities" eyebrow="How quickly referrals are picked up" flush>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Facility</th>
                  <th className="r">Received</th>
                  <th className="r">Accepted</th>
                  <th className="r">Time to respond</th>
                </tr>
              </thead>
              <tbody>
                {byFacility.map((row) => (
                  <tr key={row.f.id}>
                    <th scope="row">
                      {row.f.short}
                      <span className="cell-sub">Level {row.f.level}</span>
                    </th>
                    <td className="r num">{row.count}</td>
                    <td className="r num">{pct(row.acceptRate)}</td>
                    <td className="r num">{row.hours === null ? 'No response yet' : `${Math.round(row.hours)} h`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      {role.id === 'county' ? (
        <Panel
          title="Weekly linkage brief"
          eyebrow="AI summary of the figures above"
          aside={
            <button type="button" className="btn btn-sm" onClick={draftBrief} disabled={drafting}>
              <Icon name="assistant" size={14} />
              {drafting ? 'Drafting…' : brief ? 'Redraft' : 'Draft brief'}
            </button>
          }
        >
          {error ? (
            <p className="form-error" role="alert">
              Could not draft the brief: {error}
            </p>
          ) : null}
          {brief ? (
            <AiOutput title="Brief for the county mental health coordinator" requirement="Check against the figures before sharing">
              {brief}
            </AiOutput>
          ) : (
            <p className="muted">
              Summarises where the pathway is losing people, using only the aggregated figures on this page. No individual
              records are sent to the model.
            </p>
          )}
        </Panel>
      ) : null}
    </>
  )
}

