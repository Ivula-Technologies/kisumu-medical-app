// Referral protocol: screening bands, risk tiers, routing and timeframes.
//
// Every rule here is deterministic and explainable. The language model never
// decides a tier or a destination; it only drafts text for people to check.
//
// Thresholds follow common published cut-offs for PHQ-9, GAD-7 and AUDIT-C.
// They are placeholders until the County Mental Health Technical Team
// validates them against the 2024 National Clinical Guidelines.

export const SETTLEMENTS = [
  'Obunga',
  'Nyalenda A',
  'Nyalenda B',
  'Manyatta A',
  'Manyatta B',
  'Manyatta Arabs',
  'Kaloleni',
  'Kondele',
  'Bandani',
] as const
export type Settlement = (typeof SETTLEMENTS)[number]

export const SERVICES = [
  'Counselling',
  'Clinical review',
  'Psychiatric care',
  'Substance use care',
  'Child and adolescent',
  'Emergency psychiatric',
] as const
export type Service = (typeof SERVICES)[number]

export const AGE_BANDS = ['12–14', '15–17', '18–24', '25–34', '35–44', '45–54', '55–64', '65+'] as const
export type AgeBand = (typeof AGE_BANDS)[number]
export type Sex = 'Female' | 'Male'

export const RED_FLAGS = [
  'Suicidal thoughts with a plan or a recent attempt',
  'Signs of psychosis',
  'Risk of harm to others',
  'Severe intoxication or withdrawal',
] as const
export type RedFlag = (typeof RED_FLAGS)[number]

export const CONTEXT_FLAGS = ['Pregnant or postnatal', 'Living with HIV', 'Survivor of violence'] as const
export type ContextFlag = (typeof CONTEXT_FLAGS)[number]

export interface ScreeningInput {
  phq9: number | null
  phq9Item9: number | null
  gad7: number | null
  auditC: number | null
  sex: Sex
  ageBand: AgeBand
  redFlags: RedFlag[]
  context: ContextFlag[]
}

export type Tier = 'Emergency' | 'Urgent' | 'Routine' | 'No referral'
export type Urgency = 'Urgent' | 'Routine'

/* ── Score bands ───────────────────────────────────────────────── */

export function phq9Band(score: number): string {
  if (score >= 20) return 'Severe'
  if (score >= 15) return 'Moderately severe'
  if (score >= 10) return 'Moderate'
  if (score >= 5) return 'Mild'
  return 'Minimal'
}

export function gad7Band(score: number): string {
  if (score >= 15) return 'Severe'
  if (score >= 10) return 'Moderate'
  if (score >= 5) return 'Mild'
  return 'Minimal'
}

/** AUDIT-C positive at 4 or more for men and 3 or more for women; 8 or more suggests high risk. */
export function auditCBand(score: number, sex: Sex): string {
  if (score >= 8) return 'High risk'
  if (score >= (sex === 'Female' ? 3 : 4)) return 'Hazardous drinking'
  return 'Below threshold'
}

export function isMinor(age: AgeBand): boolean {
  return age === '12–14' || age === '15–17'
}

/** Checks scores are inside each tool's range. Returns a message per problem. */
export function validateScreening(s: ScreeningInput): string[] {
  const problems: string[] = []
  const check = (value: number | null, max: number, name: string) => {
    if (value !== null && (value < 0 || value > max || !Number.isInteger(value))) {
      problems.push(`${name} must be a whole number from 0 to ${max}.`)
    }
  }
  check(s.phq9, 27, 'PHQ-9 total')
  check(s.phq9Item9, 3, 'PHQ-9 item 9')
  check(s.gad7, 21, 'GAD-7 total')
  check(s.auditC, 12, 'AUDIT-C total')
  if (s.phq9 !== null && s.phq9Item9 !== null && s.phq9Item9 > s.phq9) {
    problems.push('PHQ-9 item 9 cannot be higher than the PHQ-9 total.')
  }
  if (s.phq9 === null && s.gad7 === null && s.auditC === null && s.redFlags.length === 0) {
    problems.push('Enter at least one screening score.')
  }
  return problems
}

/* ── Risk tier ─────────────────────────────────────────────────── */

export interface Assessment {
  tier: Tier
  reasons: string[]
  /** Service to route to first; null when no referral is needed. */
  service: Service | null
  bands: { phq9?: string; gad7?: string; auditC?: string }
}

/**
 * Turns screening results into a risk tier.
 *
 * Emergency is never a routine referral: it means stop and escalate to a
 * clinician by phone now. A positive PHQ-9 item 9 or any red flag is enough.
 */
export function assess(s: ScreeningInput): Assessment {
  const bands: Assessment['bands'] = {}
  if (s.phq9 !== null) bands.phq9 = phq9Band(s.phq9)
  if (s.gad7 !== null) bands.gad7 = gad7Band(s.gad7)
  if (s.auditC !== null) bands.auditC = auditCBand(s.auditC, s.sex)

  const emergency: string[] = s.redFlags.map((flag) => `${flag}.`)
  if ((s.phq9Item9 ?? 0) >= 1) {
    emergency.push('PHQ-9 item 9 is positive: thoughts of self-harm need a same-day safety assessment by a clinician.')
  }
  if (emergency.length) return { tier: 'Emergency', reasons: emergency, service: 'Emergency psychiatric', bands }

  const phq9 = s.phq9 ?? 0
  const gad7 = s.gad7 ?? 0
  const auditC = s.auditC ?? 0
  const alcoholPositive = s.auditC !== null && auditC >= (s.sex === 'Female' ? 3 : 4)
  const perinatal = s.context.includes('Pregnant or postnatal')

  const urgent: string[] = []
  if (phq9 >= 15) urgent.push(`PHQ-9 of ${phq9} is ${phq9Band(phq9).toLowerCase()}.`)
  if (gad7 >= 15) urgent.push(`GAD-7 of ${gad7} is severe.`)
  if (auditC >= 8) urgent.push(`AUDIT-C of ${auditC} suggests high-risk drinking.`)
  if (perinatal && phq9 >= 10) urgent.push('Moderate or worse depression during pregnancy or after birth is prioritised.')

  const routine: string[] = []
  if (phq9 >= 10 && phq9 < 15) routine.push(`PHQ-9 of ${phq9} is moderate.`)
  if (gad7 >= 10 && gad7 < 15) routine.push(`GAD-7 of ${gad7} is moderate.`)
  if (alcoholPositive && auditC < 8) routine.push(`AUDIT-C of ${auditC} is above the threshold for ${s.sex === 'Female' ? 'women' : 'men'}.`)

  const tier: Tier = urgent.length ? 'Urgent' : routine.length ? 'Routine' : 'No referral'
  if (tier === 'No referral') {
    const mild = phq9 >= 5 || gad7 >= 5
    return {
      tier,
      reasons: [
        mild
          ? 'Mild symptoms, below the referral thresholds. Give psychoeducation and re-screen at the next household visit.'
          : 'Scores are below the referral thresholds. No referral needed.',
      ],
      service: null,
      bands,
    }
  }

  // Service: the main problem decides where to go first.
  const moodLed = phq9 >= 10 || gad7 >= 10
  let service: Service
  if (!moodLed && alcoholPositive) service = 'Substance use care'
  else if (isMinor(s.ageBand)) service = 'Child and adolescent'
  else if (tier === 'Urgent' && moodLed) service = 'Psychiatric care'
  else if (alcoholPositive && auditC >= 8) service = 'Substance use care'
  else service = 'Clinical review'

  const reasons = tier === 'Urgent' ? [...urgent, ...routine] : routine
  if (moodLed && alcoholPositive && service !== 'Substance use care') {
    reasons.push('Alcohol use is also positive: ask the receiving clinician to assess it.')
  }
  return { tier, reasons, service, bands }
}

/* ── Timeframes ────────────────────────────────────────────────── */

/** Hours within which the person should be seen. Placeholder values for the county to confirm. */
export const TIMEFRAME_HOURS: Record<Urgency, number> = { Urgent: 72, Routine: 14 * 24 }

/** Target time for a clinician to respond to an emergency escalation. */
export const ESCALATION_RESPONSE_MINUTES = 30

export function timeframeLabel(urgency: Urgency): string {
  return urgency === 'Urgent' ? 'within 3 days' : 'within 14 days'
}

/* ── Facilities and routing ────────────────────────────────────── */

export interface Facility {
  id: string
  name: string
  short: string
  level: number
  services: Service[]
  /** Typical travel time in minutes from each settlement. */
  travel: Record<Settlement, number>
  slotsThisWeek: number
  medianWaitDays: number
  activeInPilot: boolean
}

export interface RouteOption {
  facility: Facility
  travelMinutes: number
  reasons: string[]
}

/**
 * Ranks facilities that offer the needed service.
 * Emergencies go to the nearest emergency service regardless of booked slots.
 * Other referrals prefer facilities with open slots, then shorter travel,
 * then shorter waits.
 */
export function rankDestinations(service: Service, settlement: Settlement, facilities: Facility[], tier: Tier): RouteOption[] {
  const offering = facilities.filter((f) => f.services.includes(service))
  const scored = offering.map((facility) => {
    const travelMinutes = facility.travel[settlement]
    const reasons = [`Offers ${service.toLowerCase()}`, `${travelMinutes} min from ${settlement}`]
    if (tier !== 'Emergency') {
      reasons.push(facility.slotsThisWeek > 0 ? `${facility.slotsThisWeek} open slots this week` : 'No open slots this week')
      reasons.push(`Median wait ${facility.medianWaitDays} days`)
    }
    return { facility, travelMinutes, reasons }
  })
  return scored.sort((a, b) => {
    if (tier !== 'Emergency') {
      const slotsA = a.facility.slotsThisWeek > 0 ? 0 : 1
      const slotsB = b.facility.slotsThisWeek > 0 ? 0 : 1
      if (slotsA !== slotsB) return slotsA - slotsB
    }
    if (a.travelMinutes !== b.travelMinutes) return a.travelMinutes - b.travelMinutes
    return a.facility.medianWaitDays - b.facility.medianWaitDays
  })
}

/* ── Referrals and their lifecycle ─────────────────────────────── */

export const REFERRAL_STATUSES = [
  'Awaiting acceptance',
  'Accepted',
  'Scheduled',
  'Attended',
  'Completed',
  'Missed',
  'Declined',
] as const
export type ReferralStatus = (typeof REFERRAL_STATUSES)[number]

export type EventKind = 'Referred' | ReferralStatus | 'Reminder sent' | 'Traced by CHP' | 'Note'

export interface ReferralEvent {
  kind: EventKind
  at: string
  by: string
  note?: string
}

export interface Referral {
  id: string
  client: string
  ageBand: AgeBand
  sex: Sex
  settlement: Settlement
  communityUnit: string
  referredBy: { role: 'CHP' | 'Clinician'; id: string; label: string }
  toFacilityId: string
  service: Service
  urgency: Urgency
  screening: ScreeningInput
  concerns: string[]
  consentRecorded: boolean
  createdAt: string
  appointmentAt?: string
  status: ReferralStatus
  events: ReferralEvent[]
}

const HOUR = 3_600_000

export function dueAt(r: Referral): Date {
  return new Date(new Date(r.createdAt).getTime() + TIMEFRAME_HOURS[r.urgency] * HOUR)
}

export function attendedAt(r: Referral): Date | null {
  const event = r.events.find((e) => e.kind === 'Attended')
  return event ? new Date(event.at) : null
}

export function reachedStage(r: Referral, kind: EventKind): boolean {
  return r.events.some((e) => e.kind === kind)
}

export type SlaState = 'Met' | 'Late' | 'On time' | 'Due soon' | 'Overdue' | 'Closed'

export interface Sla {
  state: SlaState
  label: string
}

/** Where a referral stands against its timeframe. "Due soon" means within a quarter of the window. */
export function sla(r: Referral, now: Date): Sla {
  const due = dueAt(r)
  const seen = attendedAt(r)
  if (seen) {
    const days = Math.max((seen.getTime() - new Date(r.createdAt).getTime()) / (24 * HOUR), 0)
    const when = days * 24 < 1 ? 'under 1 h' : days < 1 ? `${Math.round(days * 24)} h` : `${days.toFixed(1)} days`
    return seen <= due
      ? { state: 'Met', label: `Seen in ${when}, within timeframe` }
      : { state: 'Late', label: `Seen in ${when}, after the ${timeframeLabel(r.urgency).replace('within ', '')} timeframe` }
  }
  if (r.status === 'Declined') return { state: 'Closed', label: 'Declined. Needs redirecting.' }
  const left = due.getTime() - now.getTime()
  if (left < 0) return { state: 'Overdue', label: `Overdue by ${formatDuration(-left)}` }
  const window = TIMEFRAME_HOURS[r.urgency] * HOUR
  return left < window / 4
    ? { state: 'Due soon', label: `Due in ${formatDuration(left)}` }
    : { state: 'On time', label: `Due in ${formatDuration(left)}` }
}

export function formatDuration(ms: number): string {
  const hours = ms / HOUR
  if (hours < 1) return `${Math.max(Math.round(hours * 60), 1)} min`
  if (hours < 48) return `${Math.round(hours)} h`
  return `${Math.round(hours / 24)} days`
}

/* ── Pathway metrics ───────────────────────────────────────────── */

export interface LinkageMetrics {
  total: number
  open: number
  awaitingAcceptance: number
  overdue: number
  missed: number
  declined: number
  feedbackPending: number
  /** Share of referrals whose timeframe has ended that were seen in time. */
  withinTimeframe: number | null
  /** Share of attended referrals where the referrer has received feedback. */
  feedbackClosed: number | null
  medianHoursToAttendance: number | null
  funnel: Array<{ stage: string; count: number }>
}

export function median(values: number[]): number | null {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

export function linkageMetrics(referrals: Referral[], now: Date): LinkageMetrics {
  const states = referrals.map((r) => sla(r, now).state)
  const closedWindow = referrals.filter((_, i) => states[i] === 'Met' || states[i] === 'Late' || states[i] === 'Overdue')
  const met = states.filter((s) => s === 'Met').length
  const attended = referrals.filter((r) => attendedAt(r))
  const hours = attended.map((r) => (attendedAt(r)!.getTime() - new Date(r.createdAt).getTime()) / HOUR)

  return {
    total: referrals.length,
    open: referrals.filter((r) => r.status !== 'Completed').length,
    awaitingAcceptance: referrals.filter((r) => r.status === 'Awaiting acceptance').length,
    overdue: states.filter((s) => s === 'Overdue').length,
    missed: referrals.filter((r) => r.status === 'Missed').length,
    declined: referrals.filter((r) => r.status === 'Declined').length,
    feedbackPending: referrals.filter((r) => r.status === 'Attended').length,
    withinTimeframe: closedWindow.length ? (met / closedWindow.length) * 100 : null,
    feedbackClosed: attended.length ? (referrals.filter((r) => r.status === 'Completed').length / attended.length) * 100 : null,
    medianHoursToAttendance: median(hours),
    funnel: [
      { stage: 'Referred', count: referrals.length },
      { stage: 'Accepted', count: referrals.filter((r) => reachedStage(r, 'Accepted')).length },
      { stage: 'Scheduled', count: referrals.filter((r) => reachedStage(r, 'Scheduled')).length },
      { stage: 'Attended', count: attended.length },
      { stage: 'Feedback to referrer', count: referrals.filter((r) => r.status === 'Completed').length },
    ],
  }
}

/** Mandatory fields for a complete referral record. Returns the missing ones. */
export function missingFields(r: Referral): string[] {
  const missing: string[] = []
  if (!r.consentRecorded) missing.push('consent')
  if (!r.communityUnit) missing.push('community unit')
  const s = r.screening
  if (s.phq9 === null && s.gad7 === null && s.auditC === null) missing.push('screening score')
  return missing
}
