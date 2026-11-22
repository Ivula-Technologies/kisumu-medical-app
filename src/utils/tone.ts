/* ── Tone ─────────────────────────────────────────────────────────
   One mapping from every status word in the data to a semantic tone,
   so the same state always looks the same wherever it appears. */

export type Tone = 'critical' | 'high' | 'moderate' | 'ok' | 'info' | 'neutral'

const TONES: Record<string, Tone> = {
  critical: 'critical',
  failed: 'critical',
  'off track': 'critical',
  offline: 'critical',
  high: 'high',
  'at risk': 'high',
  escalated: 'high',
  confirmed: 'high',
  moderate: 'moderate',
  warning: 'moderate',
  pending: 'moderate',
  unverified: 'moderate',
  unreviewed: 'moderate',
  'outreach planned': 'info',
  resolved: 'ok',
  'in progress': 'moderate',
  syncing: 'info',
  'under investigation': 'info',
  info: 'info',
  low: 'ok',
  passed: 'ok',
  success: 'ok',
  connected: 'ok',
  implemented: 'ok',
  'on track': 'ok',
  approved: 'ok',
  adequate: 'ok',
  online: 'ok',
  normal: 'ok',
  // Referral pathway
  emergency: 'critical',
  urgent: 'high',
  routine: 'info',
  'no referral': 'neutral',
  'awaiting acceptance': 'moderate',
  accepted: 'info',
  scheduled: 'info',
  attended: 'ok',
  completed: 'ok',
  missed: 'high',
  declined: 'critical',
  met: 'ok',
  late: 'moderate',
  'on time': 'ok',
  'due soon': 'moderate',
  overdue: 'critical',
  closed: 'neutral',
  'awaiting clinician': 'critical',
  'clinician on the line': 'high',
  'handed over': 'info',
  planned: 'neutral',
  tracking: 'neutral',
}

export function toneOf(value: string): Tone {
  return TONES[value.trim().toLowerCase()] ?? 'neutral'
}
