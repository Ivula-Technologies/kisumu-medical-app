// The referral lifecycle. Each action records who did it and when,
// so the history doubles as the audit trail.

import type { Referral, ReferralStatus } from './referralProtocol'
import { isReceiver, isReferrerSide, type Role } from './roles'
import { facilityById } from './referralData'

export type ReferralAction =
  | { type: 'accept' }
  | { type: 'decline'; note: string }
  | { type: 'schedule'; at: string }
  | { type: 'remind' }
  | { type: 'attended' }
  | { type: 'missed' }
  | { type: 'feedback'; note: string }
  | { type: 'trace'; note: string }
  | { type: 'redirect'; facilityId: string }
  | { type: 'chase' }

export type ActionType = ReferralAction['type']

/** Which actions a role may take on a referral in its current state. */
export function allowedActions(role: Role, r: Referral): ActionType[] {
  const actions: ActionType[] = []
  const receiving: Partial<Record<ReferralStatus, ActionType[]>> = {
    'Awaiting acceptance': ['accept', 'decline'],
    Accepted: ['schedule'],
    Scheduled: ['remind', 'attended', 'missed', 'schedule'],
    Missed: ['schedule'],
    Attended: ['feedback'],
  }
  if (isReceiver(role, r)) actions.push(...(receiving[r.status] ?? []))
  if (isReferrerSide(role, r)) {
    if (r.status === 'Missed') actions.push('trace')
    if (r.status === 'Declined') actions.push('redirect')
    if (role.id === 'county' && r.status === 'Awaiting acceptance') actions.push('chase')
  }
  return actions
}

export function actorLabel(role: Role): string {
  if (role.chpId) return role.chpId
  if (role.facilityId) return `${facilityById[role.facilityId]?.short ?? 'Facility'} clinician`
  return 'County coordinator'
}

const fmt = (iso: string) =>
  new Date(iso).toLocaleString('en-KE', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

/** Applies an action and returns the updated referral. Throws if the role may not take it. */
export function applyAction(r: Referral, action: ReferralAction, role: Role, now: Date): Referral {
  if (!allowedActions(role, r).includes(action.type)) {
    throw new Error(`${actorLabel(role)} cannot ${action.type} ${r.id} while it is ${r.status.toLowerCase()}.`)
  }
  const at = now.toISOString()
  const by = actorLabel(role)
  const add = (kind: Referral['events'][number]['kind'], note?: string) => [...r.events, { kind, at, by, note }]

  switch (action.type) {
    case 'accept':
      return { ...r, status: 'Accepted', events: add('Accepted') }
    case 'decline':
      return { ...r, status: 'Declined', events: add('Declined', action.note) }
    case 'schedule':
      return {
        ...r,
        status: 'Scheduled',
        appointmentAt: action.at,
        events: add('Scheduled', `${r.status === 'Missed' ? 'Rebooked for' : r.status === 'Scheduled' ? 'Moved to' : 'Booked for'} ${fmt(action.at)}`),
      }
    case 'remind':
      return { ...r, events: add('Reminder sent', 'Reminder given to the client through their CHP') }
    case 'attended':
      return { ...r, status: 'Attended', events: add('Attended') }
    case 'missed':
      return { ...r, status: 'Missed', events: add('Missed', 'Did not attend. CHP alerted to trace.') }
    case 'feedback':
      return { ...r, status: 'Completed', events: add('Completed', action.note) }
    case 'trace':
      return { ...r, events: add('Traced by CHP', action.note) }
    case 'redirect': {
      const from = facilityById[r.toFacilityId]?.short ?? 'facility'
      const to = facilityById[action.facilityId]?.short ?? 'facility'
      return { ...r, toFacilityId: action.facilityId, status: 'Awaiting acceptance', appointmentAt: undefined, events: add('Note', `Redirected from ${from} to ${to}`) }
    }
    case 'chase':
      return { ...r, events: add('Note', 'County coordinator followed up with the receiving facility') }
  }
}
