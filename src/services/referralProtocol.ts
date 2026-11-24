// Referral protocol: screening bands, risk tiers, routing and timeframes.
//
// Every rule here is deterministic and explainable. The language model never
// decides a tier or a destination; it only drafts text for people to check.
//
// Rules follow Kenya's National Clinical Guidelines for Management of Common
// Mental Disorders (2024) wherever the guidelines specify them. Rules the
// guidelines leave open are marked as placeholders in PROTOCOL_RULES below and
// need sign-off from the County Mental Health Technical Team.

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

/** Psychiatric emergencies from guidelines section 3.9. Any one means phone a clinician now. */
export const RED_FLAGS = [
  'Self-harm or a suicide attempt needing care now',
  'Signs of psychosis, including after childbirth',
  'Risk of harm to others',
  'Severe intoxication, withdrawal or overdose',
] as const
export type RedFlag = (typeof RED_FLAGS)[number]

export const CONTEXT_FLAGS = [
  'Pregnant or postnatal',
  'Living with HIV',
  'Survivor of violence',
  'Refusing to eat, or unable to care for self',
  'Child showing signs of neglect or abuse',
] as const
export type ContextFlag = (typeof CONTEXT_FLAGS)[number]

/** CAGE-AID, guidelines Annex 4: cut down, annoyed, guilty, eye-opener. */
export const CAGE_AID_QUESTIONS = [
  'Ever felt you ought to cut down on drinking or drug use?',
  'Have people annoyed you by criticising your drinking or drug use?',
  'Ever felt bad or guilty about your drinking or drug use?',
  'Ever had a drink or used drugs first thing in the morning to steady your nerves or get rid of a hangover?',
] as const

/** ASQ suicide screening, guidelines Annex 6. Question 5 is the acuity question. */
export const ASQ_QUESTIONS = [
  'In the past few weeks, have you wished you were dead?',
  'In the past few weeks, have you felt that you or your family would be better off if you were dead?',
  'In the past week, have you been having thoughts about killing yourself?',
  'Have you ever tried to kill yourself?',
  'Are you having thoughts of killing yourself right now?',
] as const

/** Answers to the five ASQ questions; null means not asked or refused. */
export type AsqAnswers = [boolean | null, boolean | null, boolean | null, boolean | null, boolean | null]

export interface ScreeningInput {
  phq9: number | null
  phq9Item9: number | null
  gad7: number | null
  /** Number of "yes" answers to CAGE-AID, 0–4. */
  cageAid: number | null
  /** ASQ answers, or null if the ASQ was not used. */
  asq: AsqAnswers | null
  sex: Sex
  ageBand: AgeBand
  redFlags: RedFlag[]
  context: ContextFlag[]
}

/**
 * Emergency: acute suicide risk or a psychiatric emergency. Phone a clinician now.
 * Safety check: potential suicide risk. A clinician must do a brief safety
 * assessment the same day, and the person should not be left alone until then.
 * Neither is ever placed in the routine referral queue.
 */
export type Tier = 'Emergency' | 'Safety check' | 'Urgent' | 'Routine' | 'No referral'
export type Urgency = 'Urgent' | 'Routine'

export const isEscalation = (tier: Tier) => tier === 'Emergency' || tier === 'Safety check'

/* ── Score bands ───────────────────────────────────────────────── */

/** Standard PHQ-9 bands. The guidelines use PHQ-9 for severity but do not print the cut-offs. */
export function phq9Band(score: number): string {
  if (score >= 20) return 'Severe'
  if (score >= 15) return 'Moderately severe'
  if (score >= 10) return 'Moderate'
  if (score >= 5) return 'Mild'
  return 'Minimal'
}

/** GAD-7 bands exactly as in guidelines Annex 5. */
export function gad7Band(score: number): string {
  if (score >= 15) return 'Severe'
  if (score >= 10) return 'Moderate'
  if (score >= 5) return 'Mild'
  return 'Minimal'
}

/** CAGE-AID, guidelines Annex 4: one "yes" is a positive screen in primary care; two or more is clinically significant. */
export function cageAidBand(yes: number): string {
  if (yes >= 2) return 'Clinically significant'
  if (yes >= 1) return 'Positive screen'
  return 'Negative'
}

export type AsqResult = 'Not used' | 'Negative' | 'Non-acute positive' | 'Acute positive'

/**
 * ASQ, guidelines Annex 6. Yes (or refusing to answer) any of questions 1–4 is a
 * positive screen; then yes to question 5 makes it acute. A positive PHQ-9 item 9
 * with no ASQ is treated as a non-acute positive until the ASQ is asked.
 */
export function asqResult(s: ScreeningInput): AsqResult {
  const item9Positive = (s.phq9Item9 ?? 0) >= 1
  if (!s.asq) return item9Positive ? 'Non-acute positive' : 'Not used'
  const [q1, q2, q3, q4, q5] = s.asq
  const firstFour = [q1, q2, q3, q4]
  const anyAnswered = firstFour.some((a) => a !== null) || q5 !== null
  if (!anyAnswered) return item9Positive ? 'Non-acute positive' : 'Not used'
  if (q5 === true) return 'Acute positive'
  if (firstFour.some((a) => a === true)) return 'Non-acute positive'
  // Refusing to answer counts as positive.
  if (firstFour.some((a) => a === null)) return 'Non-acute positive'
  return item9Positive ? 'Non-acute positive' : 'Negative'
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
  check(s.cageAid, 4, 'CAGE-AID')
  if (s.phq9 !== null && s.phq9Item9 !== null && s.phq9Item9 > s.phq9) {
    problems.push('PHQ-9 item 9 cannot be higher than the PHQ-9 total.')
  }
  const asqUsed = s.asq !== null && s.asq.some((a) => a !== null)
  if (s.phq9 === null && s.gad7 === null && s.cageAid === null && !asqUsed && s.redFlags.length === 0 && s.context.length === 0) {
    problems.push('Enter at least one screening result.')
  }
  return problems
}

/* ── Risk tier ─────────────────────────────────────────────────── */

export interface Assessment {
  tier: Tier
  reasons: string[]
  /** Further actions the guidelines call for alongside the referral. */
  actions: string[]
  /** Service to route to first; null when no referral is needed. */
  service: Service | null
  asq: AsqResult
  bands: { phq9?: string; gad7?: string; cageAid?: string }
}

/** Turns screening results into a risk tier, following the 2024 national guidelines where they specify a rule. */
export function assess(s: ScreeningInput): Assessment {
  const bands: Assessment['bands'] = {}
  if (s.phq9 !== null) bands.phq9 = phq9Band(s.phq9)
  if (s.gad7 !== null) bands.gad7 = gad7Band(s.gad7)
  if (s.cageAid !== null) bands.cageAid = cageAidBand(s.cageAid)
  const asq = asqResult(s)
  const minor = isMinor(s.ageBand)
  const perinatal = s.context.includes('Pregnant or postnatal')

  const actions: string[] = []
  if (s.context.includes('Child showing signs of neglect or abuse')) {
    actions.push("Link the child to the Children's Office for protection (guidelines 3.7).")
  }
  if (perinatal) {
    actions.push('Ask the clinician to assess suicide and infanticide risk and to liaise with maternal health (guidelines 3.10).')
  }

  // 1. Emergencies (guidelines 3.9 and ASQ Annex 6).
  const emergency: string[] = s.redFlags.map((flag) => `${flag}.`)
  if (asq === 'Acute positive') emergency.push('ASQ question 5 is yes: imminent suicide risk. Needs an immediate safety and full mental health evaluation.')
  if (emergency.length) return { tier: 'Emergency', reasons: emergency, actions, service: 'Emergency psychiatric', asq, bands }

  // 2. Potential suicide risk (ASQ non-acute positive).
  if (asq === 'Non-acute positive') {
    const why =
      s.asq && s.asq.some((a) => a !== null)
        ? 'ASQ is positive without current thoughts of suicide: potential risk.'
        : 'PHQ-9 item 9 is positive. Ask the ASQ questions; until then this counts as a positive screen.'
    return {
      tier: 'Safety check',
      reasons: [why, 'A clinician must do a brief suicide safety assessment today. Do not leave the person alone until then.'],
      actions: [...actions, 'Suicidal ideation is a reason to refer to a mental health specialist (guidelines 3.2).'],
      service: 'Psychiatric care',
      asq,
      bands,
    }
  }

  const phq9 = s.phq9 ?? 0
  const gad7 = s.gad7 ?? 0
  const cage = s.cageAid ?? 0
  const alcohol = cage >= 1

  // 3. Urgent: placeholder thresholds, pending county sign-off.
  const urgent: string[] = []
  if (phq9 >= 15) urgent.push(`PHQ-9 of ${phq9} is ${phq9Band(phq9).toLowerCase()}.`)
  if (gad7 >= 15) urgent.push(`GAD-7 of ${gad7} is severe.`)
  if (perinatal && phq9 >= 10) urgent.push('Moderate or worse depression during pregnancy or after birth is prioritised.')
  if (s.context.includes('Refusing to eat, or unable to care for self')) urgent.push('Refusing to eat or unable to self-care: the guidelines say to consider inpatient care.')

  // 4. Routine.
  const routine: string[] = []
  if (phq9 >= 10 && phq9 < 15) routine.push(`PHQ-9 of ${phq9} is moderate.`)
  if (phq9 >= 5 && phq9 < 10) routine.push(`PHQ-9 of ${phq9} is mild. The guidelines recommend psychotherapy for mild depression.`)
  if (gad7 >= 10 && gad7 < 15) routine.push(`GAD-7 of ${gad7} is moderate.`)
  if (gad7 >= 5 && gad7 < 10) routine.push(`GAD-7 of ${gad7} is mild. The guidelines recommend psychotherapy for mild anxiety.`)
  if (alcohol) routine.push(`CAGE-AID has ${cage} yes answer${cage > 1 ? 's' : ''}: ${cageAidBand(cage).toLowerCase()}.`)

  const tier: Tier = urgent.length ? 'Urgent' : routine.length ? 'Routine' : 'No referral'
  if (tier === 'No referral') {
    return {
      tier,
      reasons: ['Scores are below the referral thresholds. No mental health referral needed now.'],
      actions,
      service: actions.length && minor ? 'Child and adolescent' : null,
      asq,
      bands,
    }
  }

  // Service: who should see the person first.
  const moderateMood = phq9 >= 10 || gad7 >= 10
  const mildMood = !moderateMood && (phq9 >= 5 || gad7 >= 5)
  let service: Service
  if (minor) service = 'Child and adolescent'
  else if (moderateMood || tier === 'Urgent') service = 'Clinical review'
  else if (alcohol) service = 'Substance use care'
  else if (mildMood) service = 'Counselling'
  else service = 'Clinical review'

  const reasons = tier === 'Urgent' ? [...urgent, ...routine] : routine
  if (alcohol && service !== 'Substance use care') reasons.push('Substance use screen is also positive: ask the receiving clinician to assess it.')
  if (mildMood && alcohol && service === 'Substance use care') reasons.push('Mild mood symptoms too: include them in the referral.')
  return { tier, reasons, actions, service, asq, bands }
}

/* ── Timeframes ────────────────────────────────────────────────── */

/** Hours within which the person should be seen. Placeholders: the guidelines set no referral timeframes. */
export const TIMEFRAME_HOURS: Record<Urgency, number> = { Urgent: 72, Routine: 14 * 24 }

/** Target time for a clinician to respond to an acute emergency. Placeholder for the county to confirm. */
export const ESCALATION_RESPONSE_MINUTES = 30

export function timeframeLabel(urgency: Urgency): string {
  return urgency === 'Urgent' ? 'within 3 days' : 'within 14 days'
}

/* ── Where each rule comes from ───────────────────────────────── */

export type RuleSource = 'National guideline' | 'Placeholder'

export interface ProtocolRule {
  area: string
  rule: string
  source: RuleSource
  reference: string
}

export const PROTOCOL_RULES: ProtocolRule[] = [
  { area: 'Suicide risk', rule: 'ASQ: yes to question 5 is acute. Immediate safety and full evaluation; keep in sight; remove dangerous objects; alert a clinician.', source: 'National guideline', reference: 'Annex 6' },
  { area: 'Suicide risk', rule: 'ASQ: yes to any of questions 1–4, or refusing to answer, is a positive screen. Brief safety assessment the same day; not left alone until assessed.', source: 'National guideline', reference: 'Annex 6' },
  { area: 'Suicide risk', rule: 'Positive PHQ-9 item 9 means asking the ASQ.', source: 'Placeholder', reference: 'App rule linking PHQ-9 and ASQ' },
  { area: 'Suicide risk', rule: 'After a crisis, contact daily at first, then weekly, for at least two months, asking about thoughts of self-harm each time.', source: 'National guideline', reference: 'Section 3.9' },
  { area: 'Emergencies', rule: 'Self-harm needing care, psychosis (including postpartum), risk to others, and overdose or withdrawal are psychiatric emergencies.', source: 'National guideline', reference: 'Section 3.9' },
  { area: 'Depression', rule: 'PHQ-9 grades severity: 5–9 mild, 10–14 moderate, 15–19 moderately severe, 20+ severe.', source: 'Placeholder', reference: 'Guidelines use PHQ-9 but do not print cut-offs' },
  { area: 'Depression', rule: 'Mild depression is treated with psychotherapy; moderate to severe with medication and psychotherapy.', source: 'National guideline', reference: 'Section 3.2' },
  { area: 'Depression', rule: 'Refer to a specialist for psychotic features, suicidal ideation, two failed antidepressants, bipolar disorder, multiple comorbidities or a special population not manageable locally.', source: 'National guideline', reference: 'Section 3.2' },
  { area: 'Anxiety', rule: 'GAD-7: 0–4 minimal, 5–9 mild, 10–14 moderate, 15–21 severe. Psychotherapy first for mild.', source: 'National guideline', reference: 'Annex 5, section 3.4' },
  { area: 'Substance use', rule: 'CAGE-AID: one yes is a positive screen in primary care; two or more is clinically significant.', source: 'National guideline', reference: 'Annex 4' },
  { area: 'Perinatal', rule: 'EPDS at 28–32 weeks of pregnancy and 6–8 weeks after birth; assess suicide and infanticide risk.', source: 'National guideline', reference: 'Section 3.10' },
  { area: 'Children', rule: 'Refer for severe or persistent symptoms, self-harm or risk to others; link neglect or abuse to the Children’s Office.', source: 'National guideline', reference: 'Section 3.7' },
  { area: 'Linkage', rule: 'The referrer phones the receiving provider, then makes a follow-up call to confirm the person arrived and was received.', source: 'National guideline', reference: 'Section 4, referral and linkage' },
  { area: 'Urgency', rule: 'Urgent if PHQ-9 or GAD-7 is 15 or more, perinatal depression is moderate or worse, or the person cannot eat or care for themselves.', source: 'Placeholder', reference: 'Guidelines set no urgency tiers' },
  { area: 'Timeframes', rule: 'Urgent referrals seen within 3 days, routine within 14 days; acute emergencies answered within 30 minutes.', source: 'Placeholder', reference: 'Guidelines set no referral timeframes' },
]

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
 * Emergencies and safety checks go to the nearest service regardless of booked slots.
 * Other referrals prefer facilities with open slots, then shorter travel,
 * then shorter waits.
 */
export function rankDestinations(service: Service, settlement: Settlement, facilities: Facility[], tier: Tier): RouteOption[] {
  const offering = facilities.filter((f) => f.services.includes(service))
  const scored = offering.map((facility) => {
    const travelMinutes = facility.travel[settlement]
    const reasons = [`Offers ${service.toLowerCase()}`, `${travelMinutes} min from ${settlement}`]
    if (!isEscalation(tier)) {
      reasons.push(facility.slotsThisWeek > 0 ? `${facility.slotsThisWeek} open slots this week` : 'No open slots this week')
      reasons.push(`Median wait ${facility.medianWaitDays} days`)
    }
    return { facility, travelMinutes, reasons }
  })
  return scored.sort((a, b) => {
    if (!isEscalation(tier)) {
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

export type EventKind = 'Referred' | ReferralStatus | 'Handover call' | 'Arrival check' | 'Reminder sent' | 'Traced by CHP' | 'Note'

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
  if (s.phq9 === null && s.gad7 === null && s.cageAid === null) missing.push('screening score')
  return missing
}
