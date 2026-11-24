import { useState } from 'react'
import { facilities, facilityById } from '../services/referralData'
import { rankDestinations, sla, timeframeLabel, type Referral } from '../services/referralProtocol'
import { allowedActions, type ReferralAction } from '../services/referralActions'
import type { Role } from '../services/roles'
import { generateReferralNote } from '../services/groqService'
import { Chips, PathwayStepper, ScoreGrid, SlaText } from '../components/referral'
import { screeningLines, slaTone } from '../utils/referralFormat'
import { AiOutput, Dot, Facts, Icon, Panel, Pill } from '../components/ui'
import { formatDateTime, relative, toLocalInput } from '../utils/time'
import { toneOf } from '../utils/tone'

type Filter = 'action' | 'open' | 'completed' | 'all'

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: 'action', label: 'Needs my action' },
  { id: 'open', label: 'Open' },
  { id: 'completed', label: 'Completed' },
  { id: 'all', label: 'All' },
]

const SEVERITY = { Overdue: 0, 'Due soon': 1, Closed: 2, 'On time': 3, Late: 4, Met: 5 }

interface Props {
  role: Role
  referrals: Referral[]
  now: Date
  selectedId: string | null
  onSelect: (id: string) => void
  onAction: (id: string, action: ReferralAction) => void
}

export function ReferralsPage({ role, referrals, now, selectedId, onSelect, onAction }: Props) {
  const needsAction = referrals.filter((r) => allowedActions(role, r).length > 0)
  const [filter, setFilter] = useState<Filter>(needsAction.length ? 'action' : 'open')
  const [query, setQuery] = useState('')

  const filtered = referrals
    .filter((r) => {
      if (filter === 'action') return allowedActions(role, r).length > 0
      if (filter === 'open') return r.status !== 'Completed'
      if (filter === 'completed') return r.status === 'Completed'
      return true
    })
    .filter((r) => {
      const q = query.trim().toLowerCase()
      return !q || [r.id, r.client, r.settlement, r.service, facilityById[r.toFacilityId]?.name ?? ''].some((v) => v.toLowerCase().includes(q))
    })
    .sort((a, b) => {
      if (a.urgency !== b.urgency) return a.urgency === 'Urgent' ? -1 : 1
      const sa = SEVERITY[sla(a, now).state]
      const sb = SEVERITY[sla(b, now).state]
      if (sa !== sb) return sa - sb
      return b.createdAt.localeCompare(a.createdAt)
    })

  const selected = referrals.find((r) => r.id === selectedId) ?? filtered[0] ?? null

  return (
    <div className="grid grid-master">
      <Panel title="Referral queue" eyebrow={role.scope} flush className="master">
        <div className="queue-tools">
          <div className="segmented" role="tablist" aria-label="Filter referrals">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={filter === f.id}
                className={filter === f.id ? 'seg active' : 'seg'}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
                {f.id === 'action' && needsAction.length ? <span className="seg-count">{needsAction.length}</span> : null}
              </button>
            ))}
          </div>
          <label className="search">
            <span className="sr-only">Search referrals</span>
            <Icon name="search" size={16} />
            <input id="referral-search" type="search" placeholder="Search ID, client, settlement" value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
        </div>
        {filtered.length ? (
          <ul className="rows" role="listbox" aria-label="Referrals">
            {filtered.map((r) => {
              const state = sla(r, now)
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected?.id === r.id}
                    className={selected?.id === r.id ? 'row row-select active' : 'row row-select'}
                    onClick={() => onSelect(r.id)}
                  >
                    <Dot tone={toneOf(r.urgency)} />
                    <span className="row-main">
                      <span className="row-title">{r.id}</span>
                      <span className="row-meta">
                        {r.client} · {r.service} → {facilityById[r.toFacilityId]?.short}
                      </span>
                      <span className={`row-meta tone-${slaTone(state.state)} sla-inline`}>{state.label}</span>
                    </span>
                    <span className="row-side">
                      <Pill>{r.status}</Pill>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="empty-state">
            {filter === 'action' ? 'Nothing needs your action right now.' : 'No referrals match.'}
          </p>
        )}
      </Panel>

      {selected ? (
        <ReferralDetail key={selected.id} referral={selected} role={role} now={now} onAction={(a) => onAction(selected.id, a)} />
      ) : (
        <Panel title="No referral selected">
          <p className="muted">Pick a referral from the queue.</p>
        </Panel>
      )}
    </div>
  )
}

function ReferralDetail({ referral: r, role, now, onAction }: { referral: Referral; role: Role; now: Date; onAction: (a: ReferralAction) => void }) {
  const facility = facilityById[r.toFacilityId]
  const actions = allowedActions(role, r)
  const [note, setNote] = useState('')
  const [declineNote, setDeclineNote] = useState('')
  const [arrivalNote, setArrivalNote] = useState('')
  const [when, setWhen] = useState(() => {
    const d = new Date(now.getTime() + 2 * 24 * 3_600_000)
    d.setHours(9, 0, 0, 0)
    return toLocalInput(d)
  })
  const alternatives = rankDestinations(r.service, r.settlement, facilities, r.urgency).filter((o) => o.facility.id !== r.toFacilityId)
  const [redirectTo, setRedirectTo] = useState(alternatives[0]?.facility.id ?? '')
  const [brief, setBrief] = useState('')
  const [drafting, setDrafting] = useState(false)
  const [error, setError] = useState('')

  const draft = async () => {
    setDrafting(true)
    setError('')
    try {
      setBrief(
        await generateReferralNote({
          referralId: r.id,
          client: r.client,
          ageBand: r.ageBand,
          sex: r.sex,
          settlement: r.settlement,
          urgency: r.urgency,
          service: r.service,
          destination: facility?.name ?? r.toFacilityId,
          scores: screeningLines(r.screening),
          concerns: r.concerns,
          context: r.screening.context,
          status: r.status,
        }),
      )
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setDrafting(false)
    }
  }

  const receiverName = facility?.name ?? 'the receiving facility'
  const noActionText =
    r.status === 'Completed'
      ? 'This referral is closed. The referrer has the outcome.'
      : role.id === 'chp'
        ? `${receiverName} acts next. You will be notified when it changes.`
        : role.id === 'facility'
          ? 'Another facility or the referrer acts next.'
          : `${receiverName} acts next. Switch to the Lumumba clinician role to see the receiving side.`

  return (
    <div className="stack">
      <Panel
        eyebrow={`${r.client} · ${r.sex}, ${r.ageBand} · ${r.settlement}${r.communityUnit ? `, ${r.communityUnit}` : ''}`}
        title={`${r.id}: ${r.service}`}
        aside={
          <>
            <Pill>{r.urgency}</Pill>
            <Pill>{r.status}</Pill>
          </>
        }
      >
        <div className="sla-row">
          <SlaText referral={r} now={now} />
          <span className="muted">
            {r.urgency} referrals should be seen {timeframeLabel(r.urgency)} of referral.
          </span>
        </div>
        <PathwayStepper referral={r} />

        <div className="detail-cols">
          <div>
            <h3 className="sub-head">Referral</h3>
            <Facts
              items={[
                { label: 'From', value: <span className="facts-small">{r.referredBy.label}</span> },
                { label: 'To', value: <span className="facts-small">{facility ? `${facility.name}, level ${facility.level}` : r.toFacilityId}</span> },
                { label: 'Travel', value: <span className="facts-small">{facility ? `${facility.travel[r.settlement]} min from ${r.settlement}` : '–'}</span> },
                {
                  label: 'Appointment',
                  value: <span className="facts-small">{r.appointmentAt ? `${formatDateTime(r.appointmentAt)} (${relative(r.appointmentAt, now)})` : 'Not booked'}</span>,
                },
              ]}
            />
          </div>
          <div>
            <h3 className="sub-head">Screening, not a diagnosis</h3>
            <ScoreGrid screening={r.screening} />
            <p className="detail-line">
              <span className="field-label">Concerns</span> <Chips items={r.concerns} />
            </p>
            <p className="detail-line">
              <span className="field-label">Context</span> <Chips items={r.screening.context} />
            </p>
            <p className="detail-line">
              <span className="field-label">Consent</span>{' '}
              {r.consentRecorded ? <span>Recorded</span> : <span className="text-critical">Not recorded. Confirm before sharing.</span>}
            </p>
          </div>
        </div>
      </Panel>

      <Panel title="Next step" eyebrow={actions.length ? 'Your action' : 'Waiting on others'}>
        {actions.length === 0 ? <p className="muted">{noActionText}</p> : null}

        {actions.includes('handover') ? (
          <div className="action-row">
            <button type="button" className="btn btn-primary" onClick={() => onAction({ type: 'handover' })}>
              <Icon name="phone" size={16} /> Record handover call to {facility?.short}
            </button>
            <span className="muted">The national guidelines ask the referrer to phone the receiving provider.</span>
          </div>
        ) : null}

        {actions.includes('arrivalCheck') ? (
          <div className="action-block">
            <label className="field-label" htmlFor="arrival-note">
              Arrival check: the appointment has passed. Call to confirm the person arrived and was received.
            </label>
            <div className="inline-form">
              <input id="arrival-note" className="input" placeholder="For example: she went and was seen; or he did not go, will rebook" value={arrivalNote} onChange={(e) => setArrivalNote(e.target.value)} />
              <button type="button" className="btn" disabled={!arrivalNote.trim()} onClick={() => onAction({ type: 'arrivalCheck', note: arrivalNote.trim() })}>
                Record call
              </button>
            </div>
          </div>
        ) : null}

        {actions.includes('accept') ? (
          <div className="action-row">
            <button type="button" className="btn btn-primary" onClick={() => onAction({ type: 'accept' })}>
              <Icon name="check" size={16} /> Accept referral
            </button>
            <span className="muted">The referrer is notified straight away.</span>
          </div>
        ) : null}

        {actions.includes('decline') ? (
          <div className="action-block">
            <label className="field-label" htmlFor="decline-note">
              Or decline, with a reason the referrer can act on
            </label>
            <div className="inline-form">
              <input id="decline-note" className="input" placeholder="For example: clinic full this month, try JOOTRH" value={declineNote} onChange={(e) => setDeclineNote(e.target.value)} />
              <button type="button" className="btn" disabled={!declineNote.trim()} onClick={() => onAction({ type: 'decline', note: declineNote.trim() })}>
                Decline
              </button>
            </div>
          </div>
        ) : null}

        {actions.includes('schedule') ? (
          <div className="action-block">
            <label className="field-label" htmlFor="appointment-at">
              {r.status === 'Missed' ? 'Rebook the appointment' : r.status === 'Scheduled' ? 'Move the appointment' : 'Book an appointment'}
            </label>
            <div className="inline-form">
              <input id="appointment-at" className="input" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
              <button type="button" className="btn btn-primary" disabled={!when} onClick={() => onAction({ type: 'schedule', at: new Date(when).toISOString() })}>
                {r.status === 'Accepted' ? 'Book' : 'Save'}
              </button>
            </div>
          </div>
        ) : null}

        {actions.includes('attended') || actions.includes('missed') || actions.includes('remind') ? (
          <div className="action-row">
            {actions.includes('attended') ? (
              <button type="button" className="btn btn-primary" onClick={() => onAction({ type: 'attended' })}>
                Mark attended
              </button>
            ) : null}
            {actions.includes('missed') ? (
              <button type="button" className="btn" onClick={() => onAction({ type: 'missed' })}>
                Mark missed
              </button>
            ) : null}
            {actions.includes('remind') ? (
              <button type="button" className="btn btn-quiet" onClick={() => onAction({ type: 'remind' })}>
                Record reminder sent
              </button>
            ) : null}
          </div>
        ) : null}

        {actions.includes('feedback') || actions.includes('trace') ? (
          <div className="action-block">
            <label className="field-label" htmlFor="action-note">
              {actions.includes('feedback') ? `Feedback to ${r.referredBy.id}: outcome and what to do at home` : 'Tracing outcome'}
            </label>
            <textarea
              id="action-note"
              className="input"
              rows={3}
              placeholder={actions.includes('feedback') ? 'For example: seen and started on a care plan. Review in 2 weeks. Please check in at the next household visit.' : 'For example: reached at home, agreed to a new date'}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <div className="action-row">
              <button
                type="button"
                className="btn btn-primary"
                disabled={!note.trim()}
                onClick={() => onAction(actions.includes('feedback') ? { type: 'feedback', note: note.trim() } : { type: 'trace', note: note.trim() })}
              >
                {actions.includes('feedback') ? 'Send feedback and close' : 'Record tracing outcome'}
              </button>
            </div>
          </div>
        ) : null}

        {actions.includes('redirect') ? (
          <div className="action-block">
            <label className="field-label" htmlFor="redirect-to">
              Redirect to another facility offering {r.service.toLowerCase()}
            </label>
            {alternatives.length ? (
              <div className="inline-form">
                <select id="redirect-to" className="input" value={redirectTo} onChange={(e) => setRedirectTo(e.target.value)}>
                  {alternatives.map((o) => (
                    <option key={o.facility.id} value={o.facility.id}>
                      {o.facility.name} · {o.travelMinutes} min · {o.facility.slotsThisWeek} slots
                    </option>
                  ))}
                </select>
                <button type="button" className="btn btn-primary" disabled={!redirectTo} onClick={() => onAction({ type: 'redirect', facilityId: redirectTo })}>
                  Redirect
                </button>
              </div>
            ) : (
              <p className="muted">No other facility in the directory offers this service.</p>
            )}
            <p className="field-hint">The timeframe still counts from the first referral.</p>
          </div>
        ) : null}

        {actions.includes('chase') ? (
          <div className="action-row">
            <button type="button" className="btn" onClick={() => onAction({ type: 'chase' })}>
              Record follow-up with {facility?.short}
            </button>
          </div>
        ) : null}
      </Panel>

      <div className="grid grid-2">
        <Panel
          title="Referral note"
          eyebrow="AI drafting aid"
          aside={
            <button type="button" className="btn btn-sm" onClick={draft} disabled={drafting}>
              <Icon name="assistant" size={14} />
              {drafting ? 'Drafting…' : brief ? 'Redraft' : 'Draft note'}
            </button>
          }
        >
          {error ? (
            <p className="form-error" role="alert">
              Could not draft the note: {error}
            </p>
          ) : null}
          {brief ? (
            <AiOutput title={`Draft for ${facility?.short ?? 'receiving clinician'}`} requirement="Check and edit before sending">
              {brief}
            </AiOutput>
          ) : (
            <p className="muted">
              Drafts a note for the receiving clinician from the pseudonymised screening fields only. It never decides the
              destination or urgency.
            </p>
          )}
        </Panel>

        <Panel title="History" eyebrow="Audit trail" aside={<span className="tag">{r.events.length} entries</span>}>
          <ol className="timeline">
            {[...r.events].reverse().map((e, i) => (
              <li key={`${e.at}-${i}`}>
                <time>{formatDateTime(e.at)}</time>
                <p>
                  <strong>{e.kind}</strong> · {e.by}
                </p>
                {e.note ? <p className="muted">{e.note}</p> : null}
              </li>
            ))}
          </ol>
        </Panel>
      </div>
    </div>
  )
}
