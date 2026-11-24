import { asqResult, cageAidBand, gad7Band, phq9Band, type ScreeningInput, type SlaState } from '../services/referralProtocol'
import type { Tone } from './tone'

const SLA_TONE: Record<SlaState, Tone> = {
  Met: 'ok',
  Late: 'moderate',
  'On time': 'ok',
  'Due soon': 'moderate',
  Overdue: 'critical',
  Closed: 'neutral',
}

export function slaTone(state: SlaState): Tone {
  return SLA_TONE[state]
}

/** Screening results as short lines, e.g. "PHQ-9 16 (moderately severe)". */
export function screeningLines(s: ScreeningInput): string[] {
  const lines: string[] = []
  if (s.phq9 !== null) lines.push(`PHQ-9 ${s.phq9} (${phq9Band(s.phq9).toLowerCase()})`)
  if (s.phq9Item9 !== null) lines.push(`PHQ-9 item 9: ${s.phq9Item9}`)
  if (s.gad7 !== null) lines.push(`GAD-7 ${s.gad7} (${gad7Band(s.gad7).toLowerCase()})`)
  if (s.cageAid !== null) lines.push(`CAGE-AID ${s.cageAid} of 4 (${cageAidBand(s.cageAid).toLowerCase()})`)
  const asq = asqResult(s)
  if (asq !== 'Not used') lines.push(`ASQ suicide screen: ${asq.toLowerCase()}`)
  return lines
}
