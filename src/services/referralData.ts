// Synthetic demo data for the referral and linkage pilot.
// Every person is fictional and identified only by a pseudonymous ID.
// Facility names, services and capacity are illustrative and must be
// replaced with the county's referral directory before any real use.
// Times are set relative to when the app loads, so the demo always looks current.

import {
  SETTLEMENTS,
  type AgeBand,
  type ContextFlag,
  type Facility,
  type Referral,
  type ReferralEvent,
  type ReferralStatus,
  type Service,
  type Settlement,
  type Sex,
  type Urgency,
} from './referralProtocol'

const NOW = Date.now()
const HOUR = 3_600_000
const ago = (hours: number) => new Date(NOW - hours * HOUR).toISOString()

/* ── Settlements in the pilot ──────────────────────────────────── */

export interface SettlementProfile {
  name: Settlement
  households: number
  communityUnits: number
  chps: number
}

const SETTLEMENT_SIZE: Record<Settlement, [number, number]> = {
  Obunga: [6200, 6],
  'Nyalenda A': [7400, 7],
  'Nyalenda B': [6100, 6],
  'Manyatta A': [8300, 8],
  'Manyatta B': [7200, 7],
  'Manyatta Arabs': [3100, 3],
  Kaloleni: [2400, 2],
  Kondele: [4800, 5],
  Bandani: [3600, 4],
}

export const settlements: SettlementProfile[] = SETTLEMENTS.map((name) => ({
  name,
  households: SETTLEMENT_SIZE[name][0],
  communityUnits: SETTLEMENT_SIZE[name][1],
  chps: SETTLEMENT_SIZE[name][1] * 10,
}))

/* ── Referral directory ────────────────────────────────────────── */

const travel = (values: number[]) => Object.fromEntries(SETTLEMENTS.map((s, i) => [s, values[i]])) as Record<Settlement, number>
//                          Obu Ny-A Ny-B Ma-A Ma-B MaAr Kal Kon Ban
export const facilities: Facility[] = [
  {
    id: 'jootrh',
    name: 'JOOTRH Psychiatric Unit',
    short: 'JOOTRH',
    level: 6,
    services: ['Emergency psychiatric', 'Psychiatric care', 'Substance use care', 'Child and adolescent'],
    travel: travel([30, 25, 28, 18, 20, 22, 12, 22, 35]),
    slotsThisWeek: 5,
    medianWaitDays: 9,
    activeInPilot: true,
  },
  {
    id: 'kcrh',
    name: 'Kisumu County Referral Hospital',
    short: 'County Referral',
    level: 5,
    services: ['Emergency psychiatric', 'Psychiatric care', 'Clinical review', 'Counselling'],
    travel: travel([25, 20, 22, 15, 18, 15, 10, 18, 30]),
    slotsThisWeek: 3,
    medianWaitDays: 6,
    activeInPilot: true,
  },
  {
    id: 'lumumba',
    name: 'Lumumba Sub-County Hospital',
    short: 'Lumumba',
    level: 4,
    services: ['Psychiatric care', 'Clinical review', 'Substance use care', 'Counselling'],
    travel: travel([15, 30, 32, 20, 22, 25, 25, 12, 20]),
    slotsThisWeek: 4,
    medianWaitDays: 5,
    activeInPilot: true,
  },
  {
    id: 'nyalenda',
    name: 'Nyalenda Health Centre',
    short: 'Nyalenda HC',
    level: 3,
    services: ['Clinical review', 'Counselling'],
    travel: travel([40, 8, 10, 30, 32, 28, 25, 35, 15]),
    slotsThisWeek: 6,
    medianWaitDays: 4,
    activeInPilot: true,
  },
  {
    id: 'manyatta',
    name: 'Manyatta Health Centre',
    short: 'Manyatta HC',
    level: 3,
    services: ['Clinical review', 'Counselling', 'Child and adolescent'],
    travel: travel([28, 30, 32, 8, 10, 12, 20, 18, 35]),
    slotsThisWeek: 0,
    medianWaitDays: 8,
    activeInPilot: true,
  },
  {
    id: 'kondele',
    name: 'Kondele Health Centre',
    short: 'Kondele HC',
    level: 3,
    services: ['Clinical review', 'Counselling'],
    travel: travel([18, 35, 38, 15, 15, 18, 22, 6, 28]),
    slotsThisWeek: 2,
    medianWaitDays: 6,
    activeInPilot: true,
  },
  {
    id: 'obunga',
    name: 'Obunga Dispensary',
    short: 'Obunga Disp.',
    level: 2,
    services: ['Counselling'],
    travel: travel([6, 40, 42, 30, 32, 30, 30, 20, 25]),
    slotsThisWeek: 7,
    medianWaitDays: 3,
    activeInPilot: false,
  },
]

export const facilityById = Object.fromEntries(facilities.map((f) => [f.id, f])) as Record<string, Facility>

/* ── Referrals ─────────────────────────────────────────────────── */

interface Seed {
  id: string
  client: string
  ageBand: AgeBand
  sex: Sex
  settlement: Settlement
  cu: string
  chp: string
  clinicianFrom?: string
  to: string
  service: Service
  urgency: Urgency
  phq9?: number
  item9?: number
  gad7?: number
  auditC?: number
  context?: ContextFlag[]
  concerns: string[]
  consent?: boolean
  created: number
  /** Status changes as [kind, hours ago, note?]. */
  steps: Array<[ReferralEvent['kind'], number, string?]>
  appointmentIn?: number
  status: ReferralStatus
}

const actor = (kind: ReferralEvent['kind'], to: string, chp: string): string => {
  const f = facilityById[to]?.short ?? 'Facility'
  if (kind === 'Traced by CHP' || kind === 'Referred') return chp
  if (kind === 'Reminder sent') return `${f} focal person`
  return `${f} clinician`
}

const seeds: Seed[] = [
  { id: 'REF-2044', client: 'MH-0431', ageBand: '25–34', sex: 'Female', settlement: 'Obunga', cu: 'Obunga East CU', chp: 'CHP-OBU-014', to: 'lumumba', service: 'Clinical review', urgency: 'Routine', phq9: 11, item9: 0, gad7: 8, concerns: ['Low mood', 'Poor sleep'], created: 3, steps: [], status: 'Awaiting acceptance' },
  { id: 'REF-2043', client: 'MH-0418', ageBand: '25–34', sex: 'Female', settlement: 'Obunga', cu: 'Obunga West CU', chp: 'CHP-OBU-014', to: 'lumumba', service: 'Psychiatric care', urgency: 'Urgent', phq9: 16, item9: 0, gad7: 12, auditC: 1, concerns: ['Low mood', 'Not eating', 'Stopped working'], created: 30, steps: [['Accepted', 26], ['Scheduled', 25]], appointmentIn: 20, status: 'Scheduled' },
  { id: 'REF-2042', client: 'MH-0412', ageBand: '35–44', sex: 'Male', settlement: 'Kondele', cu: 'Kondele Central CU', chp: 'CHP-KON-009', to: 'lumumba', service: 'Substance use care', urgency: 'Urgent', phq9: 8, item9: 0, auditC: 9, concerns: ['Daily drinking', 'Lost job'], created: 50, steps: [], status: 'Awaiting acceptance' },
  { id: 'REF-2041', client: 'MH-0397', ageBand: '18–24', sex: 'Female', settlement: 'Nyalenda A', cu: 'Nyalenda A North CU', chp: 'CHP-NYA-022', to: 'nyalenda', service: 'Clinical review', urgency: 'Urgent', phq9: 12, item9: 0, gad7: 9, context: ['Pregnant or postnatal'], concerns: ['Postnatal low mood', 'Bonding difficulty'], created: 96, steps: [['Accepted', 90], ['Scheduled', 89], ['Attended', 50]], status: 'Attended' },
  { id: 'REF-2040', client: 'MH-0388', ageBand: '45–54', sex: 'Male', settlement: 'Manyatta A', cu: 'Manyatta A Central CU', chp: 'CHP-MNY-031', to: 'manyatta', service: 'Clinical review', urgency: 'Routine', phq9: 11, item9: 0, gad7: 9, concerns: ['Worry', 'Low mood'], created: 144, steps: [['Accepted', 140], ['Scheduled', 139], ['Reminder sent', 72], ['Missed', 40]], appointmentIn: -46, status: 'Missed' },
  { id: 'REF-2039', client: 'MH-0381', ageBand: '35–44', sex: 'Female', settlement: 'Obunga', cu: 'Obunga East CU', chp: 'CHP-OBU-014', to: 'lumumba', service: 'Clinical review', urgency: 'Routine', gad7: 13, phq9: 7, item9: 0, concerns: ['Panic episodes'], created: 216, steps: [['Accepted', 210], ['Scheduled', 209], ['Attended', 96], ['Completed', 72, 'Started on a care plan with fortnightly review. Please check in at the next household visit.']], status: 'Completed' },
  { id: 'REF-2038', client: 'MH-0374', ageBand: '15–17', sex: 'Male', settlement: 'Kaloleni', cu: 'Kaloleni CU', chp: 'CHP-KAL-004', to: 'jootrh', service: 'Child and adolescent', urgency: 'Routine', phq9: 13, item9: 0, concerns: ['Withdrawn', 'Missing school'], created: 384, steps: [['Accepted', 370], ['Scheduled', 360], ['Reminder sent', 70], ['Attended', 24], ['Completed', 20, 'Seen with guardian. Follow-up booked in 4 weeks.']], status: 'Completed' },
  { id: 'REF-2037', client: 'MH-0369', ageBand: '25–34', sex: 'Female', settlement: 'Bandani', cu: 'Bandani CU', chp: 'CHP-BAN-011', to: 'kcrh', service: 'Psychiatric care', urgency: 'Urgent', phq9: 18, item9: 0, gad7: 14, concerns: ['Low mood', 'Hopelessness'], created: 120, steps: [['Accepted', 118], ['Scheduled', 117], ['Attended', 72], ['Completed', 68, 'Treatment started. Review in 2 weeks.']], status: 'Completed' },
  { id: 'REF-2036', client: 'MH-0360', ageBand: '25–34', sex: 'Male', settlement: 'Manyatta Arabs', cu: 'Manyatta Arabs CU', chp: 'CHP-MNY-044', to: 'lumumba', service: 'Substance use care', urgency: 'Routine', phq9: 6, item9: 0, auditC: 6, concerns: ['Weekend binge drinking'], created: 470, steps: [['Declined', 460, 'Substance use clinic is full this month. Please redirect to JOOTRH.']], status: 'Declined' },
  { id: 'REF-2035', client: 'MH-0355', ageBand: '55–64', sex: 'Female', settlement: 'Nyalenda B', cu: 'Nyalenda B CU', chp: 'CHP-NYA-030', to: 'nyalenda', service: 'Clinical review', urgency: 'Routine', phq9: 10, item9: 0, gad7: 11, concerns: ['Grief', 'Worry'], created: 288, steps: [['Accepted', 280], ['Scheduled', 279]], appointmentIn: 22, status: 'Scheduled' },
  { id: 'REF-2034', client: 'MH-0349', ageBand: '18–24', sex: 'Male', settlement: 'Kondele', cu: 'Kondele Central CU', chp: 'CHP-KON-009', clinicianFrom: 'kondele', to: 'jootrh', service: 'Psychiatric care', urgency: 'Urgent', phq9: 17, item9: 0, concerns: ['Low mood', 'Not sleeping'], created: 620, steps: [['Accepted', 615], ['Scheduled', 614], ['Attended', 580], ['Completed', 575, 'Assessed. Shared care plan sent to Kondele HC.']], status: 'Completed' },
  { id: 'REF-2033', client: 'MH-0340', ageBand: '45–54', sex: 'Female', settlement: 'Manyatta B', cu: 'Manyatta B CU', chp: 'CHP-MNY-052', to: 'kcrh', service: 'Psychiatric care', urgency: 'Urgent', gad7: 16, phq9: 9, item9: 0, concerns: ['Severe worry', 'Palpitations'], created: 960, steps: [['Accepted', 950], ['Scheduled', 940], ['Attended', 860], ['Completed', 850, 'Reviewed. Counselling arranged.']], status: 'Completed' },
  { id: 'REF-2032', client: 'MH-0333', ageBand: '65+', sex: 'Female', settlement: 'Kaloleni', cu: 'Kaloleni CU', chp: 'CHP-KAL-004', to: 'kcrh', service: 'Psychiatric care', urgency: 'Urgent', phq9: 15, item9: 0, concerns: ['Low mood', 'Isolation'], created: 60, steps: [['Accepted', 55], ['Scheduled', 54], ['Missed', 8]], appointmentIn: -10, status: 'Missed' },
  { id: 'REF-2031', client: 'MH-0326', ageBand: '35–44', sex: 'Male', settlement: 'Manyatta A', cu: 'Manyatta A West CU', chp: 'CHP-MNY-031', to: 'lumumba', service: 'Substance use care', urgency: 'Routine', auditC: 7, phq9: 5, item9: 0, concerns: ['Drinking affecting work'], created: 720, steps: [['Accepted', 715], ['Scheduled', 710], ['Attended', 530], ['Completed', 525, 'Enrolled in brief intervention programme.']], status: 'Completed' },
  { id: 'REF-2030', client: 'MH-0319', ageBand: '25–34', sex: 'Female', settlement: 'Nyalenda B', cu: 'Nyalenda B CU', chp: 'CHP-NYA-030', to: 'nyalenda', service: 'Clinical review', urgency: 'Routine', phq9: 13, item9: 0, gad7: 10, context: ['Living with HIV'], concerns: ['Low mood', 'Missed ART doses'], created: 840, steps: [['Accepted', 835], ['Scheduled', 830], ['Attended', 600], ['Completed', 590, 'Linked with the comprehensive care clinic for joint follow-up.']], status: 'Completed' },
  { id: 'REF-2029', client: 'MH-0311', ageBand: '18–24', sex: 'Male', settlement: 'Bandani', cu: 'Bandani CU', chp: 'CHP-BAN-011', to: 'kondele', service: 'Clinical review', urgency: 'Routine', phq9: 10, item9: 0, concerns: ['Low mood'], created: 1080, steps: [['Accepted', 1070], ['Scheduled', 1060], ['Reminder sent', 800], ['Attended', 690], ['Completed', 680, 'Seen. Monthly review.']], status: 'Completed' },
  { id: 'REF-2028', client: 'MH-0304', ageBand: '35–44', sex: 'Female', settlement: 'Obunga', cu: '', chp: 'CHP-OBU-014', to: 'obunga', service: 'Counselling', urgency: 'Routine', gad7: 10, phq9: 6, item9: 0, concerns: ['Stress', 'Money worries'], created: 1200, steps: [['Accepted', 1195], ['Scheduled', 1190], ['Missed', 1000], ['Traced by CHP', 980, 'Moved to Siaya. Asked to visit the nearest facility.']], status: 'Missed' },
  { id: 'REF-2027', client: 'MH-0298', ageBand: '25–34', sex: 'Female', settlement: 'Manyatta Arabs', cu: 'Manyatta Arabs CU', chp: 'CHP-MNY-044', to: 'kcrh', service: 'Clinical review', urgency: 'Routine', phq9: 9, item9: 0, gad7: 12, concerns: ['Worry', 'Headaches'], consent: false, created: 168, steps: [['Accepted', 160]], status: 'Accepted' },
]

const toReferral = (s: Seed): Referral => {
  const events: ReferralEvent[] = [
    { kind: 'Referred', at: ago(s.created), by: s.clinicianFrom ? `${facilityById[s.clinicianFrom].short} clinician` : s.chp },
    ...s.steps.map(([kind, hours, note]) => ({ kind, at: ago(hours), by: actor(kind, s.to, s.chp), note })),
  ]
  return {
    id: s.id,
    client: s.client,
    ageBand: s.ageBand,
    sex: s.sex,
    settlement: s.settlement,
    communityUnit: s.cu,
    referredBy: s.clinicianFrom
      ? { role: 'Clinician', id: s.clinicianFrom, label: `${facilityById[s.clinicianFrom].name} (via ${s.chp})` }
      : { role: 'CHP', id: s.chp, label: `${s.chp}, ${s.cu || s.settlement}` },
    toFacilityId: s.to,
    service: s.service,
    urgency: s.urgency,
    screening: {
      phq9: s.phq9 ?? null,
      phq9Item9: s.item9 ?? (s.phq9 !== undefined ? 0 : null),
      gad7: s.gad7 ?? null,
      auditC: s.auditC ?? null,
      sex: s.sex,
      ageBand: s.ageBand,
      redFlags: [],
      context: s.context ?? [],
    },
    concerns: s.concerns,
    consentRecorded: s.consent ?? true,
    createdAt: ago(s.created),
    appointmentAt:
      s.appointmentIn !== undefined
        ? new Date(NOW + s.appointmentIn * HOUR).toISOString()
        : s.steps.find(([k]) => k === 'Attended')
          ? ago(s.steps.find(([k]) => k === 'Attended')![1])
          : undefined,
    status: s.status,
    events,
  }
}

export const initialReferrals: Referral[] = seeds.map(toReferral)

/* ── Emergency escalations: handled by people, never queued ───── */

export type EscalationStatus = 'Awaiting clinician' | 'Clinician on the line' | 'Handed over' | 'Closed'

export interface Escalation {
  id: string
  client: string
  ageBand: AgeBand
  sex: Sex
  settlement: Settlement
  trigger: string
  raisedBy: string
  raisedAt: string
  respondedAt?: string
  responder?: string
  destination: string
  status: EscalationStatus
  log: Array<{ at: string; text: string }>
}

export const initialEscalations: Escalation[] = [
  {
    id: 'ESC-118',
    client: 'MH-0433',
    ageBand: '18–24',
    sex: 'Male',
    settlement: 'Kondele',
    trigger: 'PHQ-9 item 9 scored 2 and he disclosed a plan.',
    raisedBy: 'CHP-KON-009',
    raisedAt: ago(0.4),
    respondedAt: ago(0.3),
    responder: 'JOOTRH on-call psychiatric clinical officer',
    destination: 'JOOTRH Psychiatric Unit',
    status: 'Clinician on the line',
    log: [
      { at: ago(0.4), text: 'CHP raised an emergency from the screening screen and called the on-call line.' },
      { at: ago(0.3), text: 'On-call clinician answered and is speaking with the CHP and the client.' },
    ],
  },
  {
    id: 'ESC-117',
    client: 'MH-0427',
    ageBand: '35–44',
    sex: 'Female',
    settlement: 'Manyatta B',
    trigger: 'Signs of psychosis reported by family.',
    raisedBy: 'CHP-MNY-052',
    raisedAt: ago(26),
    respondedAt: ago(25.8),
    responder: 'County Referral on-call clinician',
    destination: 'Kisumu County Referral Hospital',
    status: 'Handed over',
    log: [
      { at: ago(26), text: 'Emergency raised by CHP.' },
      { at: ago(25.8), text: 'Clinician advised immediate transfer with a family member.' },
      { at: ago(24.5), text: 'Client received at the emergency department. Handed over to the psychiatric team.' },
    ],
  },
  {
    id: 'ESC-116',
    client: 'MH-0415',
    ageBand: '15–17',
    sex: 'Female',
    settlement: 'Nyalenda A',
    trigger: 'Recent self-harm disclosed at a school health visit.',
    raisedBy: 'CHP-NYA-022',
    raisedAt: ago(98),
    respondedAt: ago(97.4),
    responder: 'JOOTRH on-call psychiatric clinical officer',
    destination: 'JOOTRH Psychiatric Unit',
    status: 'Closed',
    log: [
      { at: ago(98), text: 'Emergency raised by CHP with the guardian present.' },
      { at: ago(97.4), text: 'Clinician assessed by phone and arranged same-day review.' },
      { at: ago(92), text: 'Seen at JOOTRH. Safety plan in place. Child protection officer informed.' },
      { at: ago(48), text: 'Closed after follow-up call confirmed she attended her review.' },
    ],
  },
]

/* ── Weekly trend, 8 weeks ─────────────────────────────────────── */

export const weeklyTrend = {
  weeks: ['W35', 'W36', 'W37', 'W38', 'W39', 'W40', 'W41', 'W42'],
  referred: [9, 11, 10, 13, 12, 15, 14, 18],
  attended: [5, 7, 7, 8, 9, 11, 10, 12],
}

export const pilotPeriod = 'Pilot weeks 1–8'
