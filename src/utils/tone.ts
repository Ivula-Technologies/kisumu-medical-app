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
}

export function toneOf(value: string): Tone {
  return TONES[value.trim().toLowerCase()] ?? 'neutral'
}
