import type { Escalation, EscalationStatus } from '../services/referralData'
import { ESCALATION_RESPONSE_MINUTES, median } from '../services/referralProtocol'
import { KpiStrip, Panel, Pill } from '../components/ui'
import { formatDateTime, relative } from '../utils/time'

const NEXT: Partial<Record<EscalationStatus, { to: EscalationStatus; label: string; text: (e: Escalation) => string }>> = {
  'Awaiting clinician': {
    to: 'Clinician on the line',
    label: 'Clinician answered',
    text: (e) => (e.acuity === 'Acute' ? 'On-call clinician answered and is speaking with the health worker.' : 'Clinician is doing a brief suicide safety assessment.'),
  },
  'Clinician on the line': {
    to: 'Handed over',
    label: 'Handed over',
    text: (e) => (e.acuity === 'Acute' ? `Handed over in person at ${e.destination}.` : `Safety assessment done. Specialist review arranged at ${e.destination}.`),
  },
  'Handed over': {
    to: 'Closed',
    label: 'Close with follow-up plan',
    text: () => 'Closed. Follow-up plan in place: contact daily at first, then weekly, for at least two months, asking about thoughts of self-harm each time.',
  },
}

const responseMinutes = (e: Escalation) => (e.respondedAt ? (new Date(e.respondedAt).getTime() - new Date(e.raisedAt).getTime()) / 60_000 : null)

interface Props {
  escalations: Escalation[]
  now: Date
  actor: string
  onAdvance: (id: string, to: EscalationStatus, text: string) => void
}

export function EscalationsPage({ escalations, now, actor, onAdvance }: Props) {
  const active = escalations.filter((e) => e.status !== 'Closed')
  const acute = escalations.filter((e) => e.acuity === 'Acute')
  const times = acute.map(responseMinutes).filter((m): m is number => m !== null)
  const onTarget = times.filter((m) => m <= ESCALATION_RESPONSE_MINUTES).length
  const sorted = [...escalations].sort((a, b) => {
    if ((a.status === 'Closed') !== (b.status === 'Closed')) return a.status === 'Closed' ? 1 : -1
    return b.raisedAt.localeCompare(a.raisedAt)
  })

  return (
    <>
      <KpiStrip
        label="Escalation response"
        items={[
          {
            label: 'Active escalations',
            value: active.length,
            note: `${active.filter((e) => e.acuity === 'Acute').length} acute, ${active.filter((e) => e.acuity === 'Non-acute').length} same-day safety checks`,
          },
          {
            label: 'Median time to clinician, acute',
            value: times.length ? Math.round(median(times)!) : '–',
            unit: 'min',
            meter: times.length ? { value: Math.min(median(times)!, 60), max: 60, tone: median(times)! <= ESCALATION_RESPONSE_MINUTES ? 'ok' : 'critical' } : undefined,
            note: `Target ${ESCALATION_RESPONSE_MINUTES} minutes or less`,
          },
          { label: 'Acute answered within target', value: `${onTarget} / ${times.length}`, note: 'Non-acute checks are due the same day' },
          { label: 'Raised in the pilot', value: escalations.length, note: 'Never placed in the referral queue' },
        ]}
      />

      <div className="grid grid-main">
        <div className="stack">
          {sorted.map((e) => {
            const step = NEXT[e.status]
            const mins = responseMinutes(e)
            return (
              <section key={e.id} className={e.status === 'Closed' ? 'panel escalation closed' : 'panel escalation'}>
                <header className="panel-head">
                  <div className="panel-titles">
                    <p className="eyebrow">
                      {e.client} · {e.sex}, {e.ageBand} · {e.settlement} · raised {relative(e.raisedAt, now)} by {e.raisedBy}
                    </p>
                    <h2>{e.id}: {e.trigger}</h2>
                  </div>
                  <div className="panel-aside">
                    <Pill>{e.acuity}</Pill>
                    <Pill>{e.status}</Pill>
                  </div>
                </header>
                <div className="panel-body">
                  <div className="esc-facts">
                    <span>
                      <span className="field-label">Destination</span> {e.destination}
                    </span>
                    <span>
                      <span className="field-label">Clinician response</span>{' '}
                      {mins !== null ? (
                        <span className={e.acuity === 'Non-acute' || mins <= ESCALATION_RESPONSE_MINUTES ? 'text-ok' : 'text-critical'}>
                          {mins < 120 ? `${Math.max(Math.round(mins), 1)} min` : `${Math.round(mins / 60)} h`}
                        </span>
                      ) : (
                        <span className="text-critical">Waiting {relative(e.raisedAt, now).replace(' ago', '')}</span>
                      )}
                      {e.responder ? <span className="muted"> · {e.responder}</span> : null}
                    </span>
                  </div>
                  <ol className="timeline">
                    {e.log.map((l, i) => (
                      <li key={i}>
                        <time>{formatDateTime(l.at)}</time>
                        <p>{l.text}</p>
                      </li>
                    ))}
                  </ol>
                  {step ? (
                    <div className="action-row">
                      <button type="button" className={e.status === 'Awaiting clinician' ? 'btn btn-danger' : 'btn'} onClick={() => onAdvance(e.id, step.to, `${step.text(e)} Recorded by ${actor}.`)}>
                        {step.label}
                      </button>
                      <span className="muted">Record what has happened. The app does not contact anyone.</span>
                    </div>
                  ) : null}
                </div>
              </section>
            )
          })}
        </div>

        <Panel title="Protocol" eyebrow="National guidelines, section 3.9 and Annex 6">
          <h3 className="sub-head">Acute: imminent risk</h3>
          <ol className="protocol">
            <li>
              <strong>Keep the person in sight</strong> and do not leave them alone. Remove dangerous objects such as pesticides, medicines and sharp tools if it is safe.
            </li>
            <li>
              <strong>Phone the on-call clinician now.</strong> <span className="placeholder">[Numbers to be confirmed by the county]</span> If life is in danger, call <strong>999</strong> or <strong>112</strong>.
            </li>
            <li>
              <strong>The person needs an immediate safety and full mental health evaluation.</strong> The guidelines advise admission for at least 24 hours after a suicide attempt.
            </li>
          </ol>
          <h3 className="sub-head">Non-acute: potential risk</h3>
          <ol className="protocol">
            <li>
              <strong>A clinician does a brief suicide safety assessment the same day.</strong> The person should not be left alone until then.
            </li>
            <li>
              <strong>Refer to a mental health specialist</strong> if the assessment finds suicidal ideation.
            </li>
          </ol>
          <h3 className="sub-head">After every escalation</h3>
          <ol className="protocol">
            <li>
              <strong>Follow up closely:</strong> phone or visit daily at first, then weekly, for at least two months. Ask about thoughts of self-harm every time.
            </li>
            <li>
              <strong>Involve family and friends</strong> to support the person and restrict access to means of self-harm.
            </li>
          </ol>
          <div className="callout">
            <h3>Why this is separate from referrals</h3>
            <p>Suicide risk, psychosis and risk of harm need a person on the phone, not a queue or a text message. The referral system never routes these cases, and the AI never handles them.</p>
          </div>
        </Panel>
      </div>
    </>
  )
}
