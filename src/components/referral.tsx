import type { ReactNode } from 'react'
import {
  asqResult,
  cageAidBand,
  gad7Band,
  phq9Band,
  sla,
  type Referral,
  type ScreeningInput,
} from '../services/referralProtocol'
import { formatDateTime } from '../utils/time'
import { Pill } from './ui'
import { slaTone } from '../utils/referralFormat'

/* ── Pathway stepper ───────────────────────────────────────────── */

const STEPS: Array<{ label: string; kind: Referral['events'][number]['kind'] }> = [
  { label: 'Referred', kind: 'Referred' },
  { label: 'Accepted', kind: 'Accepted' },
  { label: 'Scheduled', kind: 'Scheduled' },
  { label: 'Attended', kind: 'Attended' },
  { label: 'Feedback sent', kind: 'Completed' },
]

/** The five steps of a referral, with when each happened and where it is stuck. */
export function PathwayStepper({ referral }: { referral: Referral }) {
  const lastIndex = STEPS.reduce((acc, step, i) => (referral.events.some((e) => e.kind === step.kind) ? i : acc), 0)
  const problem = referral.status === 'Missed' ? 'Missed' : referral.status === 'Declined' ? 'Declined' : null

  return (
    <ol className="stepper" aria-label="Referral pathway">
      {STEPS.map((step, i) => {
        const event = [...referral.events].reverse().find((e) => e.kind === step.kind)
        const done = i <= lastIndex && Boolean(event)
        const blocked = problem !== null && i === lastIndex + 1
        const current = !done && !blocked && i === lastIndex + 1 && referral.status !== 'Completed'
        const cls = done ? 'done' : blocked ? 'blocked' : current ? 'current' : ''
        return (
          <li key={step.label} className={`step ${cls}`}>
            <span className="step-mark" aria-hidden="true" />
            <span className="step-label">{blocked ? problem : step.label}</span>
            <span className="step-time">{done && event ? formatDateTime(event.at) : blocked ? 'Needs action' : current ? 'Waiting' : ''}</span>
          </li>
        )
      })}
    </ol>
  )
}

/* ── SLA ───────────────────────────────────────────────────────── */

export function SlaText({ referral, now }: { referral: Referral; now: Date }) {
  const s = sla(referral, now)
  return <span className={`sla tone-${slaTone(s.state)}`}>{s.label}</span>
}

/* ── Screening summary ─────────────────────────────────────────── */

export function ScoreGrid({ screening }: { screening: ScreeningInput }) {
  const cells: Array<{ tool: string; score: string; band: string }> = []
  if (screening.phq9 !== null) cells.push({ tool: 'PHQ-9', score: `${screening.phq9}/27`, band: phq9Band(screening.phq9) })
  if (screening.phq9Item9 !== null) cells.push({ tool: 'Item 9', score: `${screening.phq9Item9}/3`, band: screening.phq9Item9 > 0 ? 'Positive' : 'Negative' })
  if (screening.gad7 !== null) cells.push({ tool: 'GAD-7', score: `${screening.gad7}/21`, band: gad7Band(screening.gad7) })
  if (screening.cageAid !== null) cells.push({ tool: 'CAGE-AID', score: `${screening.cageAid}/4`, band: cageAidBand(screening.cageAid) })
  const asq = asqResult(screening)
  if (asq !== 'Not used') cells.push({ tool: 'ASQ', score: asq === 'Negative' ? 'Negative' : 'Positive', band: asq })
  return (
    <dl className="scores">
      {cells.map((c) => (
        <div key={c.tool}>
          <dt>{c.tool}</dt>
          <dd className="num">{c.score}</dd>
          <dd className="scores-band">{c.band}</dd>
        </div>
      ))}
    </dl>
  )
}

/* ── Funnel ────────────────────────────────────────────────────── */

export function Funnel({ stages }: { stages: Array<{ stage: string; count: number }> }) {
  const max = Math.max(...stages.map((s) => s.count), 1)
  return (
    <ol className="funnel">
      {stages.map((s, i) => {
        const prev = i > 0 ? stages[i - 1].count : null
        const drop = prev ? Math.round(((prev - s.count) / prev) * 100) : 0
        return (
          <li key={s.stage}>
            <span className="funnel-label">{s.stage}</span>
            <span className="funnel-track">
              <span className="funnel-bar" style={{ width: `${(s.count / max) * 100}%` }} />
            </span>
            <span className="funnel-count num">{s.count}</span>
            <span className={drop > 0 ? 'funnel-drop' : 'funnel-drop none'}>{prev !== null && drop > 0 ? `−${drop}%` : ''}</span>
          </li>
        )
      })}
    </ol>
  )
}

/* ── Misc ──────────────────────────────────────────────────────── */

export function Chips({ items, empty = 'None recorded' }: { items: string[]; empty?: string }): ReactNode {
  if (!items.length) return <span className="muted">{empty}</span>
  return (
    <span className="chips">
      {items.map((item) => (
        <span key={item} className="chip">
          {item}
        </span>
      ))}
    </span>
  )
}

export function UrgencyPill({ urgency }: { urgency: string }) {
  return <Pill>{urgency}</Pill>
}
