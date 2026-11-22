import type { Escalation, EscalationStatus } from '../services/referralData'
import { ESCALATION_RESPONSE_MINUTES, median } from '../services/referralProtocol'
import { KpiStrip, Panel, Pill } from '../components/ui'
import { formatDateTime, relative } from '../utils/time'

const NEXT: Partial<Record<EscalationStatus, { to: EscalationStatus; label: string; text: (e: Escalation) => string }>> = {
  'Awaiting clinician': { to: 'Clinician on the line', label: 'Clinician answered', text: () => 'On-call clinician answered and is speaking with the health worker.' },
  'Clinician on the line': { to: 'Handed over', label: 'Handed over', text: (e) => `Handed over in person at ${e.destination}.` },
  'Handed over': { to: 'Closed', label: 'Close after follow-up', text: () => 'Closed after a follow-up call confirmed the person is in care.' },
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
  const times = escalations.map(responseMinutes).filter((m): m is number => m !== null)
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
          { label: 'Active escalations', value: active.length, note: active.length ? 'Being handled by phone' : 'None right now' },
          {
            label: 'Median time to clinician',
            value: times.length ? Math.round(median(times)!) : '–',
            unit: 'min',
            meter: times.length ? { value: Math.min(median(times)!, 60), max: 60, tone: median(times)! <= ESCALATION_RESPONSE_MINUTES ? 'ok' : 'critical' } : undefined,
            note: `Target ${ESCALATION_RESPONSE_MINUTES} minutes or less`,
          },
          { label: 'Answered within target', value: `${onTarget} / ${times.length}`, note: 'Escalations with a recorded response' },
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
                        <span className={mins <= ESCALATION_RESPONSE_MINUTES ? 'text-ok' : 'text-critical'}>{Math.max(Math.round(mins), 1)} min</span>
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

        <Panel title="Emergency protocol" eyebrow="Same for every health worker">
          <ol className="protocol">
            <li>
              <strong>Stay with the person.</strong> Do not leave them alone, and remove means of harm if it is safe.
            </li>
            <li>
              <strong>Phone the on-call clinician.</strong> JOOTRH or the County Referral Hospital, whichever is nearer.{' '}
              <span className="placeholder">[Numbers to be confirmed by the county]</span>
            </li>
            <li>
              <strong>If life is in danger, call 999 or 112.</strong>
            </li>
            <li>
              <strong>Record the escalation</strong> from the screening screen so the county can follow it to handover.
            </li>
            <li>
              <strong>Follow up within 48 hours</strong> to confirm the person is in care, then close it.
            </li>
          </ol>
          <div className="callout">
            <h3>Why this is separate from referrals</h3>
            <p>
              Suicidal intent, psychosis and risk of harm need a person on the phone, not a queue or a text message. The
              referral system never routes these cases, and the AI never handles them.
            </p>
          </div>
        </Panel>
      </div>
    </>
  )
}
