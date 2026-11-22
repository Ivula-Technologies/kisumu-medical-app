import { useState } from 'react'
import {
  AGE_BANDS,
  CONTEXT_FLAGS,
  RED_FLAGS,
  SETTLEMENTS,
  assess,
  rankDestinations,
  timeframeLabel,
  validateScreening,
  type AgeBand,
  type ContextFlag,
  type RedFlag,
  type Referral,
  type ScreeningInput,
  type Settlement,
  type Sex,
} from '../services/referralProtocol'
import { facilities, type Escalation } from '../services/referralData'
import { actorLabel } from '../services/referralActions'
import type { Role, RoleId } from '../services/roles'
import { ScoreGrid } from '../components/referral'
import { Icon, Panel, Pill } from '../components/ui'

interface Form {
  settlement: Settlement
  communityUnit: string
  ageBand: AgeBand
  sex: Sex
  phq9: string
  item9: string
  gad7: string
  auditC: string
  redFlags: RedFlag[]
  context: ContextFlag[]
  concerns: string
  consent: boolean
}

const EXAMPLES: Record<string, Partial<Form>> = {
  Routine: { ageBand: '35–44', sex: 'Female', phq9: '12', item9: '0', gad7: '9', auditC: '1', redFlags: [], context: [], concerns: 'Low mood, poor sleep' },
  Urgent: { ageBand: '25–34', sex: 'Female', phq9: '13', item9: '0', gad7: '11', auditC: '0', redFlags: [], context: ['Pregnant or postnatal'], concerns: 'Postnatal low mood, not eating' },
  Emergency: { ageBand: '18–24', sex: 'Male', phq9: '19', item9: '2', gad7: '14', auditC: '6', redFlags: ['Suicidal thoughts with a plan or a recent attempt'], context: [], concerns: 'Hopelessness, talked about ending his life' },
}

const toScore = (v: string) => (v.trim() === '' ? null : Number(v))

interface Props {
  role: Role
  now: Date
  nextReferralId: string
  nextClientId: string
  nextEscalationId: string
  onSwitchRole: (id: RoleId) => void
  onCreate: (r: Referral) => void
  onEscalate: (e: Escalation) => void
}

export function NewReferralPage({ role, now, nextReferralId, nextClientId, nextEscalationId, onSwitchRole, onCreate, onEscalate }: Props) {
  const [form, setForm] = useState<Form>({
    settlement: (role.settlement as Settlement) ?? 'Obunga',
    communityUnit: role.settlement ? `${role.settlement} East CU` : '',
    ageBand: '35–44',
    sex: 'Female',
    phq9: '12',
    item9: '0',
    gad7: '9',
    auditC: '1',
    redFlags: [],
    context: [],
    concerns: 'Low mood, poor sleep',
    consent: true,
  })
  const [pick, setPick] = useState<string | null>(null)
  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }))
  const toggle = <T extends string>(list: T[], item: T) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item])

  const screening: ScreeningInput = {
    phq9: toScore(form.phq9),
    phq9Item9: toScore(form.item9),
    gad7: toScore(form.gad7),
    auditC: toScore(form.auditC),
    sex: form.sex,
    ageBand: form.ageBand,
    redFlags: form.redFlags,
    context: form.context,
  }
  const problems = validateScreening(screening)
  const result = problems.length ? null : assess(screening)
  const routes = result?.service ? rankDestinations(result.service, form.settlement, facilities, result.tier).slice(0, 3) : []
  const chosen = routes.find((o) => o.facility.id === pick) ?? routes[0]
  const canCreate = role.id !== 'county'
  const concerns = form.concerns.split(',').map((c) => c.trim()).filter(Boolean)

  const create = () => {
    if (!result || !chosen || !result.service || result.tier === 'Emergency' || result.tier === 'No referral') return
    const at = now.toISOString()
    const by = actorLabel(role)
    onCreate({
      id: nextReferralId,
      client: nextClientId,
      ageBand: form.ageBand,
      sex: form.sex,
      settlement: form.settlement,
      communityUnit: form.communityUnit.trim(),
      referredBy:
        role.id === 'chp'
          ? { role: 'CHP', id: role.chpId!, label: `${role.chpId}, ${form.communityUnit.trim() || form.settlement}` }
          : { role: 'Clinician', id: role.facilityId!, label: 'Lumumba Sub-County Hospital' },
      toFacilityId: chosen.facility.id,
      service: result.service,
      urgency: result.tier,
      screening,
      concerns,
      consentRecorded: form.consent,
      createdAt: at,
      status: 'Awaiting acceptance',
      events: [{ kind: 'Referred', at, by, note: `Routed to ${chosen.facility.name}: ${chosen.reasons.slice(1, 3).join(', ').toLowerCase()}` }],
    })
  }

  const escalate = () => {
    if (!result || result.tier !== 'Emergency') return
    const at = now.toISOString()
    onEscalate({
      id: nextEscalationId,
      client: nextClientId,
      ageBand: form.ageBand,
      sex: form.sex,
      settlement: form.settlement,
      trigger: result.reasons.join(' '),
      raisedBy: actorLabel(role),
      raisedAt: at,
      destination: routes[0]?.facility.name ?? 'Nearest emergency psychiatric service',
      status: 'Awaiting clinician',
      log: [{ at, text: `${actorLabel(role)} raised an emergency from screening and called the on-call line.` }],
    })
  }

  return (
    <div className="grid grid-main">
      <Panel
        title="Screen and refer"
        eyebrow="Approved tools: PHQ-9, GAD-7, AUDIT-C"
        aside={
          <div className="example-btns">
            <span className="muted">Load example</span>
            {Object.keys(EXAMPLES).map((name) => (
              <button key={name} type="button" className="btn btn-sm" onClick={() => setForm((f) => ({ ...f, ...EXAMPLES[name] }))}>
                {name}
              </button>
            ))}
          </div>
        }
      >
        {role.id === 'county' ? (
          <div className="callout">
            <h3>Referrals are created by CHPs and clinicians</h3>
            <p>You can try the screening rules here. To create a referral, continue as the Obunga CHP.</p>
            <button type="button" className="btn btn-sm" onClick={() => onSwitchRole('chp')}>
              Continue as CHP-OBU-014
            </button>
          </div>
        ) : null}

        <fieldset className="form-section">
          <legend>Person</legend>
          <div className="form-grid">
            <label className="field">
              <span className="field-label">Settlement</span>
              <select id="f-settlement" className="input" value={form.settlement} onChange={(e) => set('settlement', e.target.value as Settlement)}>
                {SETTLEMENTS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="field-label">Community unit</span>
              <input id="f-cu" className="input" value={form.communityUnit} onChange={(e) => set('communityUnit', e.target.value)} />
            </label>
            <label className="field">
              <span className="field-label">Age band</span>
              <select id="f-age" className="input" value={form.ageBand} onChange={(e) => set('ageBand', e.target.value as AgeBand)}>
                {AGE_BANDS.map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="field-label">Sex</span>
              <select id="f-sex" className="input" value={form.sex} onChange={(e) => set('sex', e.target.value as Sex)}>
                <option>Female</option>
                <option>Male</option>
              </select>
            </label>
          </div>
          <p className="field-hint">The record uses a pseudonymous ID ({nextClientId}). Names stay in eCHIS or KenyaEMR.</p>
        </fieldset>

        <fieldset className="form-section">
          <legend>Screening scores</legend>
          <div className="form-grid">
            {(
              [
                ['phq9', 'PHQ-9 total', 27],
                ['item9', 'PHQ-9 item 9', 3],
                ['gad7', 'GAD-7 total', 21],
                ['auditC', 'AUDIT-C total', 12],
              ] as const
            ).map(([key, label, max]) => (
              <label key={key} className="field">
                <span className="field-label">
                  {label} <span className="muted">0–{max}</span>
                </span>
                <input id={`f-${key}`} className="input num" type="number" min={0} max={max} value={form[key]} onChange={(e) => set(key, e.target.value)} />
              </label>
            ))}
          </div>
          <p className="field-hint">Item 9 asks about thoughts of self-harm. Any score above 0 means an emergency escalation.</p>
        </fieldset>

        <fieldset className="form-section">
          <legend>Red flags: any one is an emergency</legend>
          <div className="checks">
            {RED_FLAGS.map((flag) => (
              <label key={flag} className="check danger">
                <input type="checkbox" checked={form.redFlags.includes(flag)} onChange={() => set('redFlags', toggle(form.redFlags, flag))} />
                {flag}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="form-section">
          <legend>Context and concerns</legend>
          <div className="checks">
            {CONTEXT_FLAGS.map((flag) => (
              <label key={flag} className="check">
                <input type="checkbox" checked={form.context.includes(flag)} onChange={() => set('context', toggle(form.context, flag))} />
                {flag}
              </label>
            ))}
          </div>
          <label className="field">
            <span className="field-label">Concerns reported, separated by commas</span>
            <input id="f-concerns" className="input" value={form.concerns} onChange={(e) => set('concerns', e.target.value)} />
          </label>
          <label className="check">
            <input type="checkbox" checked={form.consent} onChange={(e) => set('consent', e.target.checked)} />
            Informed consent to refer and share screening results was given
          </label>
        </fieldset>
      </Panel>

      <div className="stack sticky-col">
        {problems.length ? (
          <Panel title="Check the scores">
            <ul className="checklist warn">
              {problems.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </Panel>
        ) : result ? (
          result.tier === 'Emergency' ? (
            <section className="emergency" aria-live="assertive">
              <p className="emergency-eyebrow">Emergency · do not create a routine referral</p>
              <h2>Stay with the person and call the on-call clinician now</h2>
              <ul className="emergency-reasons">
                {result.reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
              <ol className="emergency-steps">
                <li>Do not leave the person alone. Remove anything they could use to harm themselves, if it is safe to do so.</li>
                <li>
                  Call the on-call psychiatric clinician at <strong>{routes[0]?.facility.name ?? 'the nearest emergency service'}</strong> ({routes[0]?.travelMinutes ?? '–'} min away). <span className="placeholder">[On-call number to be confirmed by the county]</span>
                </li>
                <li>If there is immediate danger to life, call <strong>999</strong> or <strong>112</strong>.</li>
                <li>Record the escalation so the county can follow it through.</li>
              </ol>
              <button type="button" className="btn btn-danger" onClick={escalate}>
                <Icon name="flag" size={16} /> Record emergency escalation
              </button>
              <p className="emergency-note">Messages and the referral queue are never a substitute for a phone call. Consent does not block an emergency.</p>
            </section>
          ) : (
            <Panel title="Result" eyebrow="Screening, not a diagnosis" aside={<Pill>{result.tier}</Pill>}>
              <ScoreGrid screening={screening} />
              <ul className="checklist">
                {result.reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
              {result.tier === 'No referral' ? null : (
                <p className="muted">
                  {result.tier} referral for <strong>{result.service?.toLowerCase()}</strong>, to be seen {timeframeLabel(result.tier)}.
                </p>
              )}
            </Panel>
          )
        ) : null}

        {result && result.tier !== 'Emergency' && result.tier !== 'No referral' ? (
          <Panel title="Where to refer" eyebrow="Ranked by open slots, travel time, then wait" flush>
            <ul className="rows">
              {routes.map((o, i) => (
                <li key={o.facility.id}>
                  <label className={chosen?.facility.id === o.facility.id ? 'row route active' : 'row route'}>
                    <input type="radio" name="destination" checked={chosen?.facility.id === o.facility.id} onChange={() => setPick(o.facility.id)} />
                    <span className="row-main">
                      <span className="row-title">
                        {o.facility.name} {i === 0 ? <span className="tag">Best match</span> : null}
                      </span>
                      <span className="row-meta">
                        Level {o.facility.level} · {o.reasons.slice(1).join(' · ')}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            <div className="panel-pad">
              <button type="button" className="btn btn-primary btn-block" disabled={!canCreate || !form.consent || !chosen} onClick={create}>
                Send referral {nextReferralId}
                <Icon name="arrow" size={16} />
              </button>
              <p className="field-hint">
                {!form.consent
                  ? 'Record consent before sending.'
                  : !canCreate
                    ? 'Continue as a CHP to send.'
                    : `${chosen?.facility.short} is notified straight away and has to accept or decline.`}
              </p>
            </div>
          </Panel>
        ) : null}
      </div>
    </div>
  )
}
