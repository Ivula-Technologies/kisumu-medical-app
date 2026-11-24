import { useState } from 'react'
import {
  AGE_BANDS,
  ASQ_QUESTIONS,
  CAGE_AID_QUESTIONS,
  CONTEXT_FLAGS,
  RED_FLAGS,
  SETTLEMENTS,
  assess,
  isEscalation,
  rankDestinations,
  timeframeLabel,
  validateScreening,
  type AgeBand,
  type AsqAnswers,
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

type YesNo = boolean | null

interface Form {
  settlement: Settlement
  communityUnit: string
  ageBand: AgeBand
  sex: Sex
  phq9: string
  item9: string
  gad7: string
  cage: [boolean, boolean, boolean, boolean]
  asq: AsqAnswers
  redFlags: RedFlag[]
  context: ContextFlag[]
  concerns: string
  consent: boolean
  handoverCall: boolean
}

const NO_ASQ: AsqAnswers = [null, null, null, null, null]
const NO_CAGE: Form['cage'] = [false, false, false, false]

const EXAMPLES: Record<string, Partial<Form>> = {
  Routine: { ageBand: '35–44', sex: 'Female', phq9: '12', item9: '0', gad7: '9', cage: NO_CAGE, asq: NO_ASQ, redFlags: [], context: [], concerns: 'Low mood, poor sleep' },
  Urgent: { ageBand: '25–34', sex: 'Female', phq9: '13', item9: '0', gad7: '11', cage: NO_CAGE, asq: NO_ASQ, redFlags: [], context: ['Pregnant or postnatal'], concerns: 'Postnatal low mood, not eating' },
  'Safety check': { ageBand: '45–54', sex: 'Male', phq9: '14', item9: '1', gad7: '8', cage: [true, false, true, false], asq: [true, false, false, false, false], redFlags: [], context: [], concerns: 'Hopelessness after losing work' },
  Emergency: { ageBand: '18–24', sex: 'Male', phq9: '19', item9: '2', gad7: '14', cage: [true, true, false, false], asq: [true, true, true, false, true], redFlags: [], context: [], concerns: 'Talked about ending his life today' },
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

function YesNoButtons({ id, value, onChange }: { id: string; value: YesNo; onChange: (v: YesNo) => void }) {
  return (
    <span className="yesno" role="radiogroup" aria-labelledby={id}>
      {([true, false] as const).map((v) => (
        <button
          key={String(v)}
          type="button"
          role="radio"
          aria-checked={value === v}
          className={value === v ? `yn ${v ? 'yes' : 'no'} active` : 'yn'}
          onClick={() => onChange(value === v ? null : v)}
        >
          {v ? 'Yes' : 'No'}
        </button>
      ))}
    </span>
  )
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
    cage: NO_CAGE,
    asq: NO_ASQ,
    redFlags: [],
    context: [],
    concerns: 'Low mood, poor sleep',
    consent: true,
    handoverCall: true,
  })
  const [pick, setPick] = useState<string | null>(null)
  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }))
  const toggle = <T extends string>(list: T[], item: T) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item])

  const asqUsed = form.asq.some((a) => a !== null)
  const screening: ScreeningInput = {
    phq9: toScore(form.phq9),
    phq9Item9: toScore(form.item9),
    gad7: toScore(form.gad7),
    cageAid: form.cage.filter(Boolean).length,
    asq: asqUsed ? form.asq : null,
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
  const item9Positive = (screening.phq9Item9 ?? 0) >= 1
  const asqNeedsQ5 = form.asq.slice(0, 4).some((a) => a === true) && form.asq[4] === null
  const perinatal = form.context.includes('Pregnant or postnatal')

  const create = () => {
    if (!result || !chosen || !result.service || isEscalation(result.tier) || result.tier === 'No referral') return
    const at = now.toISOString()
    const by = actorLabel(role)
    const events: Referral['events'] = [{ kind: 'Referred', at, by, note: `Routed to ${chosen.facility.name}: ${chosen.reasons.slice(1, 3).join(', ').toLowerCase()}` }]
    if (form.handoverCall) events.push({ kind: 'Handover call', at, by, note: `Phoned ${chosen.facility.short} to tell them about the referral` })
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
      events,
    })
  }

  const escalate = () => {
    if (!result || !isEscalation(result.tier)) return
    const at = now.toISOString()
    const acute = result.tier === 'Emergency'
    onEscalate({
      id: nextEscalationId,
      acuity: acute ? 'Acute' : 'Non-acute',
      client: nextClientId,
      ageBand: form.ageBand,
      sex: form.sex,
      settlement: form.settlement,
      trigger: result.reasons[0],
      raisedBy: actorLabel(role),
      raisedAt: at,
      destination: routes[0]?.facility.name ?? 'Nearest mental health service',
      status: 'Awaiting clinician',
      log: [
        {
          at,
          text: acute
            ? `${actorLabel(role)} raised an emergency from screening, is staying with the person and called the on-call clinician.`
            : `${actorLabel(role)} raised a same-day safety check and asked a clinician for a brief safety assessment.`,
        },
      ],
    })
  }

  return (
    <div className="grid grid-main">
      <Panel
        title="Screen and refer"
        eyebrow="Tools from the 2024 national guidelines: PHQ-9, GAD-7, CAGE-AID, ASQ"
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
          <legend>Depression and anxiety</legend>
          <div className="form-grid">
            {(
              [
                ['phq9', 'PHQ-9 total', 27],
                ['item9', 'PHQ-9 item 9', 3],
                ['gad7', 'GAD-7 total', 21],
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
          <p className="field-hint">Item 9 asks about thoughts of being better off dead or of self-harm. If it is above 0, ask the ASQ below.</p>
        </fieldset>

        <fieldset className={item9Positive ? 'form-section asq-section highlight' : 'form-section asq-section'}>
          <legend>Suicide risk: ASQ {item9Positive ? <span className="tag tag-warn">Ask now: item 9 is positive</span> : <span className="muted">(ask if item 9 is positive or you are worried)</span>}</legend>
          <ol className="question-list">
            {ASQ_QUESTIONS.map((q, i) => (
              <li key={q} className={i === 4 && !form.asq.slice(0, 4).some((a) => a === true) ? 'q-muted' : ''}>
                <span id={`asq-${i}`}>
                  {i === 4 ? <strong>Acuity: </strong> : null}
                  {q}
                </span>
                <YesNoButtons
                  id={`asq-${i}`}
                  value={form.asq[i]}
                  onChange={(v) => {
                    const next = [...form.asq] as AsqAnswers
                    next[i] = v
                    set('asq', next)
                  }}
                />
              </li>
            ))}
          </ol>
          {asqNeedsQ5 ? <p className="field-hint text-critical">A question 1–4 is yes: ask question 5 now.</p> : null}
          <p className="field-hint">Guidelines Annex 6. Refusing to answer counts as a positive screen.</p>
        </fieldset>

        <fieldset className="form-section">
          <legend>Alcohol and drugs: CAGE-AID</legend>
          <div className="checks">
            {CAGE_AID_QUESTIONS.map((q, i) => (
              <label key={q} className="check">
                <input
                  type="checkbox"
                  checked={form.cage[i]}
                  onChange={() => {
                    const next = [...form.cage] as Form['cage']
                    next[i] = !next[i]
                    set('cage', next)
                  }}
                />
                {q}
              </label>
            ))}
          </div>
          <p className="field-hint">Guidelines Annex 4. One yes is a positive screen; two or more is clinically significant.</p>
        </fieldset>

        <fieldset className="form-section">
          <legend>Emergencies: any one means phone a clinician now</legend>
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
          {perinatal ? (
            <p className="field-hint">The guidelines recommend the Edinburgh Postnatal Depression Scale at 28–32 weeks of pregnancy and 6–8 weeks after birth.</p>
          ) : null}
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
                <li>Keep the person in sight. Do not leave them alone.</li>
                <li>Remove anything they could use to harm themselves, such as pesticides, medicines or sharp objects, if it is safe to do so.</li>
                <li>
                  Call the on-call clinician at <strong>{routes[0]?.facility.name ?? 'the nearest emergency service'}</strong> ({routes[0]?.travelMinutes ?? '–'} min away). <span className="placeholder">[On-call number to be confirmed by the county]</span>
                </li>
                <li>If there is immediate danger to life, call <strong>999</strong> or <strong>112</strong>.</li>
                <li>Record the escalation so the county can follow it to handover.</li>
              </ol>
              <button type="button" className="btn btn-danger" onClick={escalate}>
                <Icon name="flag" size={16} /> Record emergency escalation
              </button>
              <p className="emergency-note">From the national guidelines, section 3.9 and Annex 6. A phone call, never a message or the referral queue. Consent does not block an emergency.</p>
            </section>
          ) : result.tier === 'Safety check' ? (
            <section className="emergency safety" aria-live="assertive">
              <p className="emergency-eyebrow">Same-day safety check · not a routine referral</p>
              <h2>A clinician needs to do a brief safety assessment today</h2>
              <ul className="emergency-reasons">
                {result.reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
              <ol className="emergency-steps">
                <li>Stay with the person, or make sure a trusted family member stays, until a clinician has assessed them.</li>
                <li>
                  Phone a clinician at <strong>{routes[0]?.facility.name ?? 'the nearest facility'}</strong> today for a brief suicide safety assessment. <span className="placeholder">[Contact to be confirmed by the county]</span>
                </li>
                <li>Agree on removing access to means of self-harm at home.</li>
                <li>Record the safety check. The clinician decides on a specialist referral.</li>
              </ol>
              <button type="button" className="btn btn-warn" onClick={escalate}>
                <Icon name="flag" size={16} /> Record same-day safety check
              </button>
              <p className="emergency-note">From the national guidelines, Annex 6 (non-acute positive ASQ) and section 3.2 (refer suicidal ideation to a specialist).</p>
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

        {result && result.actions.length ? (
          <Panel title="Also do" eyebrow="From the national guidelines">
            <ul className="checklist">
              {result.actions.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </Panel>
        ) : null}

        {result && !isEscalation(result.tier) && result.tier !== 'No referral' ? (
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
              <label className="check">
                <input type="checkbox" checked={form.handoverCall} onChange={(e) => set('handoverCall', e.target.checked)} />
                I have phoned {chosen?.facility.short ?? 'the facility'} to tell them about this referral
              </label>
              <button type="button" className="btn btn-primary btn-block" disabled={!canCreate || !form.consent || !chosen} onClick={create}>
                Send referral {nextReferralId}
                <Icon name="arrow" size={16} />
              </button>
              <p className="field-hint">
                {!form.consent
                  ? 'Record consent before sending.'
                  : !canCreate
                    ? 'Continue as a CHP to send.'
                    : form.handoverCall
                      ? `${chosen?.facility.short} is notified and has to accept or decline. After the appointment, call to confirm the person arrived.`
                      : 'The guidelines ask the referrer to phone the receiving provider. You can record the call later.'}
              </p>
            </div>
          </Panel>
        ) : null}
      </div>
    </div>
  )
}
