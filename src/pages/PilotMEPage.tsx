import { facilities, pilotPeriod } from '../services/referralData'
import { attendedAt, dueAt, linkageMetrics, missingFields, type Referral } from '../services/referralProtocol'
import { KpiStrip, Panel, Pill } from '../components/ui'

type Status = 'On Track' | 'At Risk' | 'Off Track' | 'Tracking'

interface Indicator {
  id: string
  area: string
  name: string
  value: number | null
  unit: '%' | 'count'
  target: number | null
  targetLabel: string
  source: 'Live' | 'Synthetic'
  how: string
}

/** On track at or above target; at risk within 10 points (or 85% of a count target); otherwise off track. */
function statusOf(i: Indicator): Status {
  if (i.value === null || i.target === null) return 'Tracking'
  if (i.value >= i.target) return 'On Track'
  const close = i.unit === '%' ? i.value >= i.target - 10 : i.value >= i.target * 0.85
  return close ? 'At Risk' : 'Off Track'
}

const show = (i: Indicator) => (i.value === null ? '–' : i.unit === '%' ? `${Math.round(i.value)}%` : i.value.toLocaleString())

export function PilotMEPage({ referrals, now }: { referrals: Referral[]; now: Date }) {
  const m = linkageMetrics(referrals, now)
  const due = referrals.filter((r) => attendedAt(r) || now > dueAt(r))
  const assessed = due.filter((r) => attendedAt(r)).length
  const followUpEligible = referrals.filter((r) => ['Attended', 'Completed', 'Missed'].includes(r.status))
  const followedUp = followUpEligible.filter((r) => r.status === 'Completed' || r.events.some((e) => e.kind === 'Traced by CHP')).length
  const complete = referrals.filter((r) => missingFields(r).length === 0).length
  const active = facilities.filter((f) => f.activeInPilot).length

  const indicators: Indicator[] = [
    { id: 'PI-01', area: 'Digital screening', name: 'People screened with approved digital tools', value: 1284, unit: 'count', target: null, targetLabel: 'Set with the funder', source: 'Synthetic', how: 'Screenings recorded in eCHIS with PHQ-9, GAD-7, CAGE-AID or ASQ' },
    { id: 'PI-02', area: 'Early identification', name: 'Screening-positive people who received a clinical assessment', value: due.length ? (assessed / due.length) * 100 : null, unit: '%', target: 80, targetLabel: '80% or more', source: 'Live', how: 'Attended referrals out of those whose timeframe has ended' },
    { id: 'PI-03', area: 'Clinical assessment', name: 'Frontline health workers trained and supported', value: 268, unit: 'count', target: 327, targetLabel: '327', source: 'Synthetic', how: 'Training and mentorship register' },
    { id: 'PI-04', area: 'Referral effectiveness', name: 'Referrals completed within the clinically appropriate timeframe', value: m.withinTimeframe, unit: '%', target: 75, targetLabel: '75% or more', source: 'Live', how: 'Seen within 3 days (urgent) or 14 days (routine)' },
    { id: 'PI-05', area: 'Follow-up', name: 'Referred people with documented follow-up', value: followUpEligible.length ? (followedUp / followUpEligible.length) * 100 : null, unit: '%', target: 80, targetLabel: '80% or more', source: 'Live', how: 'Feedback sent after attendance, or tracing recorded after a missed visit' },
    { id: 'PI-06', area: 'Data quality', name: 'Complete mandatory referral records', value: referrals.length ? (complete / referrals.length) * 100 : null, unit: '%', target: 90, targetLabel: '90% or more', source: 'Live', how: 'Consent, community unit and at least one screening score present' },
    { id: 'PI-07', area: 'System adoption', name: 'Targeted facilities actively using the solution', value: (active / facilities.length) * 100, unit: '%', target: 80, targetLabel: '80% or more', source: 'Live', how: 'Facilities in the referral directory marked active' },
    { id: 'PI-08', area: 'User experience', name: 'Health workers reporting better access to decision support', value: 76, unit: '%', target: 80, targetLabel: '80% or more', source: 'Synthetic', how: 'Quarterly user survey' },
  ]

  const statuses = indicators.map(statusOf)
  const overall: Status = statuses.includes('Off Track') ? 'Off Track' : statuses.includes('At Risk') ? 'At Risk' : 'On Track'
  const median = m.medianHoursToAttendance

  const technical = [
    { name: 'Time from identification to clinical assessment', how: 'Median time from referral to attendance', now: median === null ? '–' : `${(median / 24).toFixed(1)} days`, status: 'Live' },
    { name: 'Referral rejection rate', how: 'Declined referrals out of all referrals', now: `${Math.round((m.declined / Math.max(m.total, 1)) * 100)}%`, status: 'Live' },
    { name: 'Non-completion rate', how: 'Missed or overdue out of referrals whose timeframe has ended', now: `${Math.round(((m.missed + m.overdue) / Math.max(due.length, 1)) * 100)}%`, status: 'Live' },
    { name: 'Sensitivity and specificity of the screening and risk rules', how: 'Against clinician assessment of the same people', now: 'Needs clinician-confirmed outcomes', status: 'Planned' },
    { name: 'False positives and negatives by age, sex and settlement', how: 'Bias check on the same comparison', now: 'Needs clinician-confirmed outcomes', status: 'Planned' },
    { name: 'Calibration of any predictive model', how: 'Only if a predictive model is added', now: 'No predictive model in the prototype', status: 'Planned' },
    { name: 'System availability, offline use and sync', how: 'Uptime and sync logs from field devices', now: 'Measured once deployed', status: 'Planned' },
    { name: 'Cost per person screened, assessed and linked to care', how: 'Implementation cost analysis, months 19–20', now: 'Measured during the pilot', status: 'Planned' },
  ]

  return (
    <>
      <KpiStrip
        label="Pilot status"
        items={[
          { label: 'Overall status', value: overall, note: 'Follows the weakest indicator' },
          { label: 'Indicators on track', value: `${statuses.filter((s) => s === 'On Track').length} / ${indicators.length}`, note: `${statuses.filter((s) => s === 'Tracking').length} tracked without a target yet` },
          { label: 'Calculated live', value: indicators.filter((i) => i.source === 'Live').length, note: 'From the referral records in this app' },
          { label: 'Reporting period', value: pilotPeriod.replace('Pilot ', ''), note: 'Targets are proposals until the baseline' },
        ]}
      />

      <Panel title="Pilot indicators" eyebrow="From the concept note, specific objective (c) and component 3" flush>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Indicator</th>
                <th className="r">Now</th>
                <th className="r">Target</th>
                <th>Status</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {indicators.map((i, n) => (
                <tr key={i.id}>
                  <td className="mono">{i.id}</td>
                  <th scope="row" className="cell-text">
                    {i.name}
                    <span className="cell-sub">
                      {i.area} · {i.how}
                    </span>
                  </th>
                  <td className="r num">{show(i)}</td>
                  <td className="r num nowrap">{i.targetLabel}</td>
                  <td>
                    <Pill>{statuses[n]}</Pill>
                  </td>
                  <td>
                    <span className="tag">{i.source}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Technical and clinical performance" eyebrow="Measures the pilot adds" flush>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Measure</th>
                <th>How</th>
                <th>Now</th>
              </tr>
            </thead>
            <tbody>
              {technical.map((t) => (
                <tr key={t.name}>
                  <th scope="row" className="cell-text">
                    {t.name}
                  </th>
                  <td className="cell-text">{t.how}</td>
                  <td>
                    {t.status === 'Live' ? <span className="num">{t.now}</span> : <span className="muted">{t.now}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <p className="page-foot">
        These are proposed pilot targets, not county performance figures. They will be set after the baseline assessment with the County Department of Health. More screening will not be read as more illness.
      </p>
    </>
  )
}
