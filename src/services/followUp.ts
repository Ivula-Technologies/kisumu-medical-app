// Follow-up worklists. Shared by the Follow-up page and the sidebar count,
// so both always agree.

import { facilityById } from './referralData'
import type { Referral } from './referralProtocol'
import { formatDateTime, relative } from '../utils/time'

const HOUR = 3_600_000

export interface FollowUpList {
  id: string
  title: string
  owner: string
  why: string
  tone: 'critical' | 'high' | 'moderate' | 'info'
  items: Referral[]
  detail: (r: Referral) => string
}

export function followUpLists(referrals: Referral[], now: Date): FollowUpList[] {
  const t = now.getTime()
  const traced = (r: Referral) => r.events.some((e) => e.kind === 'Traced by CHP')
  const lastEvent = (r: Referral, kind: string) => [...r.events].reverse().find((e) => e.kind === kind)
  const short = (r: Referral) => facilityById[r.toFacilityId]?.short ?? 'facility'

  return [
    {
      id: 'missed',
      title: 'Missed appointments to trace',
      owner: 'Referring CHP',
      why: 'People who did not attend. A home visit is the fastest way to find out why and rebook.',
      tone: 'high',
      items: referrals.filter((r) => r.status === 'Missed' && !traced(r)),
      detail: (r) => `Missed ${relative(lastEvent(r, 'Missed')?.at ?? r.createdAt, now)} at ${short(r)}`,
    },
    {
      id: 'rebook',
      title: 'Traced, waiting to be rebooked',
      owner: 'Receiving facility',
      why: 'The CHP has reached the person. The facility needs to offer a new date.',
      tone: 'moderate',
      items: referrals.filter((r) => r.status === 'Missed' && traced(r)),
      detail: (r) => lastEvent(r, 'Traced by CHP')?.note ?? 'Traced',
    },
    {
      id: 'reminders',
      title: 'Appointments in the next 48 hours',
      owner: 'Receiving facility',
      why: 'Send a reminder through the CHP. Automated SMS is planned for routine cases only.',
      tone: 'info',
      items: referrals.filter((r) => {
        if (r.status !== 'Scheduled' || !r.appointmentAt) return false
        const until = new Date(r.appointmentAt).getTime() - t
        return until > 0 && until < 48 * HOUR
      }),
      detail: (r) =>
        `${formatDateTime(r.appointmentAt!)} at ${short(r)}${r.events.some((e) => e.kind === 'Reminder sent' && new Date(e.at).getTime() > t - 72 * HOUR) ? ' · reminder sent' : ''}`,
    },
    {
      id: 'feedback',
      title: 'Feedback owed to referrers',
      owner: 'Receiving facility',
      why: 'The person was seen, but the CHP has not been told the outcome or what to do at home.',
      tone: 'moderate',
      items: referrals.filter((r) => r.status === 'Attended'),
      detail: (r) => `Seen ${relative(lastEvent(r, 'Attended')?.at ?? r.createdAt, now)} · referred by ${r.referredBy.id}`,
    },
    {
      id: 'waiting',
      title: 'Not accepted after 24 hours',
      owner: 'Receiving facility, then coordinator',
      why: 'A referral nobody has picked up is the first place people get lost.',
      tone: 'moderate',
      items: referrals.filter((r) => r.status === 'Awaiting acceptance' && t - new Date(r.createdAt).getTime() > 24 * HOUR),
      detail: (r) => `Sent ${relative(r.createdAt, now)} to ${short(r)}`,
    },
    {
      id: 'declined',
      title: 'Declined, needs redirecting',
      owner: 'Referrer or coordinator',
      why: 'The facility could not take the person. Choose another destination.',
      tone: 'critical',
      items: referrals.filter((r) => r.status === 'Declined'),
      detail: (r) => lastEvent(r, 'Declined')?.note ?? 'Declined',
    },
  ]
}

export const followUpTaskCount = (referrals: Referral[], now: Date) =>
  followUpLists(referrals, now).reduce((sum, l) => sum + l.items.length, 0)
