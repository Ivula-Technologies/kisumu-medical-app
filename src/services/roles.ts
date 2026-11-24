// Who is using the app, what they can see and what they are notified about.
// A demo role switch stands in for real sign-in and role-based access control.

import { sla, type Referral } from './referralProtocol'
import { facilityById, type Escalation } from './referralData'

export type RoleId = 'county' | 'facility' | 'chp'

export interface Role {
  id: RoleId
  label: string
  short: string
  initials: string
  scope: string
  facilityId?: string
  chpId?: string
  settlement?: string
}

export const ROLES: Record<RoleId, Role> = {
  county: {
    id: 'county',
    label: 'County mental health coordinator',
    short: 'County coordinator',
    initials: 'MH',
    scope: 'All 9 settlements · pseudonymised',
  },
  facility: {
    id: 'facility',
    label: 'Clinician, Lumumba Sub-County Hospital',
    short: 'Lumumba clinician',
    initials: 'LS',
    scope: 'Referrals to Lumumba SCH',
    facilityId: 'lumumba',
  },
  chp: {
    id: 'chp',
    label: 'Community Health Promoter, CHP-OBU-014',
    short: 'CHP, Obunga',
    initials: 'CP',
    scope: 'Own referrals · Obunga',
    chpId: 'CHP-OBU-014',
    settlement: 'Obunga',
  },
}

/** Referrals a role is allowed to see. */
export function visibleReferrals(role: Role, referrals: Referral[]): Referral[] {
  if (role.facilityId) return referrals.filter((r) => r.toFacilityId === role.facilityId)
  if (role.chpId) return referrals.filter((r) => r.referredBy.id === role.chpId || r.events.some((e) => e.by === role.chpId))
  return referrals
}

/** True when this role receives the referral and so can accept, schedule and close it. */
export const isReceiver = (role: Role, r: Referral) => role.facilityId === r.toFacilityId

/** True when this role sent the referral, or coordinates the pathway, and so can redirect or trace. */
export const isReferrerSide = (role: Role, r: Referral) =>
  role.id === 'county' || (role.chpId !== undefined && (r.referredBy.id === role.chpId || r.events.some((e) => e.by === role.chpId)))

/* ── Notifications ─────────────────────────────────────────────── */

export interface Notice {
  id: string
  tone: 'critical' | 'high' | 'moderate' | 'info' | 'ok'
  title: string
  detail: string
  referralId?: string
  escalationId?: string
}

const HOUR = 3_600_000

export function notificationsFor(role: Role, referrals: Referral[], escalations: Escalation[], now: Date): Notice[] {
  const list: Notice[] = []
  const mine = visibleReferrals(role, referrals)

  if (role.id === 'county') {
    for (const e of escalations.filter((x) => x.status !== 'Closed' && x.status !== 'Handed over')) {
      list.push({ id: `esc-${e.id}`, tone: e.acuity === 'Acute' ? 'critical' : 'high', title: e.acuity === 'Acute' ? `Emergency ${e.id} is active` : `Same-day safety check ${e.id}`, detail: `${e.settlement} · ${e.status}`, escalationId: e.id })
    }
  }

  for (const r of mine) {
    const f = facilityById[r.toFacilityId]?.short ?? 'facility'
    const state = sla(r, now)
    const waitingHours = (now.getTime() - new Date(r.createdAt).getTime()) / HOUR

    if (isReceiver(role, r)) {
      if (r.status === 'Awaiting acceptance') {
        list.push({ id: `new-${r.id}`, tone: r.urgency === 'Urgent' ? 'high' : 'info', title: `New ${r.urgency.toLowerCase()} referral ${r.id}`, detail: `${r.service} · from ${r.referredBy.id}`, referralId: r.id })
      }
      if (r.status === 'Scheduled' && r.appointmentAt) {
        const until = new Date(r.appointmentAt).getTime() - now.getTime()
        if (until > 0 && until < 48 * HOUR) list.push({ id: `rem-${r.id}`, tone: 'info', title: `Reminder due for ${r.id}`, detail: `Appointment in ${Math.round(until / HOUR)} h`, referralId: r.id })
      }
      if (r.status === 'Attended') {
        list.push({ id: `fb-${r.id}`, tone: 'moderate', title: `Feedback owed for ${r.id}`, detail: `${r.referredBy.id} is waiting to hear the outcome`, referralId: r.id })
      }
    }

    if (isReferrerSide(role, r)) {
      if (r.status === 'Missed' && !r.events.some((e) => e.kind === 'Traced by CHP')) {
        list.push({ id: `miss-${r.id}`, tone: 'high', title: `${r.id} missed the appointment`, detail: `Trace ${r.client} in ${r.settlement}`, referralId: r.id })
      }
      if (r.status === 'Declined') {
        list.push({ id: `dec-${r.id}`, tone: 'critical', title: `${r.id} was declined by ${f}`, detail: 'Redirect to another facility', referralId: r.id })
      }
      if (role.id === 'chp') {
        if (r.status === 'Scheduled' && r.appointmentAt && new Date(r.appointmentAt).getTime() < now.getTime() && !r.events.some((e) => e.kind === 'Arrival check' && e.at >= r.appointmentAt!)) {
          list.push({ id: `arr-${r.id}`, tone: 'moderate', title: `Arrival check due for ${r.id}`, detail: `Call to confirm ${r.client} reached ${f}`, referralId: r.id })
        }
        if (['Awaiting acceptance', 'Accepted', 'Scheduled'].includes(r.status) && !r.events.some((e) => e.kind === 'Handover call')) {
          list.push({ id: `ho-${r.id}`, tone: 'info', title: `Handover call not recorded for ${r.id}`, detail: `Phone ${f} to tell them about the referral`, referralId: r.id })
        }
        if (r.status === 'Completed') {
          const fb = [...r.events].reverse().find((e) => e.kind === 'Completed')
          if (fb && now.getTime() - new Date(fb.at).getTime() < 7 * 24 * HOUR) {
            list.push({ id: `done-${r.id}`, tone: 'ok', title: `Feedback received for ${r.id}`, detail: fb.note ?? `${f} closed the referral`, referralId: r.id })
          }
        }
        if (r.status === 'Scheduled' && r.appointmentAt) {
          list.push({ id: `sch-${r.id}`, tone: 'info', title: `${r.id} booked at ${f}`, detail: new Date(r.appointmentAt).toLocaleString('en-KE', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }), referralId: r.id })
        }
      }
      if (role.id === 'county') {
        if (r.status === 'Awaiting acceptance' && waitingHours > 24) {
          list.push({ id: `wait-${r.id}`, tone: 'moderate', title: `${r.id} not accepted after ${Math.round(waitingHours)} h`, detail: `Follow up with ${f}`, referralId: r.id })
        }
        if (state.state === 'Overdue' && r.status !== 'Missed') {
          list.push({ id: `od-${r.id}`, tone: 'critical', title: `${r.id} is overdue`, detail: state.label, referralId: r.id })
        }
      }
    }
  }

  const order = { critical: 0, high: 1, moderate: 2, info: 3, ok: 4 }
  return list.sort((a, b) => order[a.tone] - order[b.tone])
}
