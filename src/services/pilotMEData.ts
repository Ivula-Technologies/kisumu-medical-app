export type PilotIndicator = {
  id: string
  name: string
  description: string
  currentValue: number | string
  baselineValue: number | string
  targetValue: number | string
  unit: string
  trend: 'improving' | 'stable' | 'declining'
  status: 'On Track' | 'At Risk' | 'Off Track'
  subCounties: string[]
}

export type PilotMESummary = {
  reportingPeriod: string
  activePilotSubCounties: number
  totalFacilitiesInPilot: number
  weeklyActiveUsers: number
}

export const pilotIndicators: PilotIndicator[] = [
  {
    id: 'PI-01',
    name: 'Reporting Timeliness',
    description: 'Percentage of facilities submitting weekly reports within 48 hours of week end',
    currentValue: 88.7,
    baselineValue: 76.3,
    targetValue: 90,
    unit: '%',
    trend: 'improving',
    status: 'On Track',
    subCounties: ['Kisumu Central', 'Kisumu East', 'Kisumu West', 'Seme', 'Nyakach', 'Nyando', 'Muhoroni'],
  },
  {
    id: 'PI-02',
    name: 'Data Completeness',
    description: 'Percentage of expected data fields populated in weekly submissions',
    currentValue: 92.4,
    baselineValue: 84.1,
    targetValue: 95,
    unit: '%',
    trend: 'improving',
    status: 'On Track',
    subCounties: ['Kisumu Central', 'Kisumu East', 'Kisumu West', 'Seme', 'Nyakach', 'Nyando', 'Muhoroni'],
  },
  {
    id: 'PI-03',
    name: 'Alert Verification Time',
    description: 'Median hours from AI signal generation to human verification decision',
    currentValue: 4.2,
    baselineValue: 18.5,
    targetValue: 6,
    unit: 'hours',
    trend: 'improving',
    status: 'On Track',
    subCounties: ['Kisumu Central', 'Kisumu East', 'Kisumu West', 'Seme', 'Nyakach', 'Nyando', 'Muhoroni'],
  },
  {
    id: 'PI-04',
    name: 'Forecast Error (MAPE)',
    description: 'Mean Absolute Percentage Error for 3-month commodity demand forecasts',
    currentValue: 14.8,
    baselineValue: 28.3,
    targetValue: 15,
    unit: '%',
    trend: 'improving',
    status: 'On Track',
    subCounties: ['Kisumu Central', 'Kisumu East', 'Kisumu West', 'Seme', 'Nyakach', 'Nyando', 'Muhoroni'],
  },
  {
    id: 'PI-05',
    name: 'Weekly Active Users',
    description: 'Number of unique officers logging into the dashboard per week',
    currentValue: 47,
    baselineValue: 23,
    targetValue: 60,
    unit: 'users',
    trend: 'improving',
    status: 'At Risk',
    subCounties: ['Kisumu Central', 'Kisumu East', 'Kisumu West', 'Seme', 'Nyakach', 'Nyando', 'Muhoroni'],
  },
  {
    id: 'PI-06',
    name: 'Signal Action Rate',
    description: 'Percentage of verified signals that resulted in a documented public health action',
    currentValue: 73.2,
    baselineValue: 41.0,
    targetValue: 80,
    unit: '%',
    trend: 'improving',
    status: 'At Risk',
    subCounties: ['Kisumu Central', 'Kisumu East', 'Kisumu West', 'Seme', 'Nyakach', 'Nyando', 'Muhoroni'],
  },
  {
    id: 'PI-07',
    name: 'Stockout Prevention',
    description: 'Percentage of predicted stockouts averted through redistribution',
    currentValue: 62.5,
    baselineValue: 34.0,
    targetValue: 75,
    unit: '%',
    trend: 'improving',
    status: 'At Risk',
    subCounties: ['Kisumu Central', 'Kisumu East', 'Kisumu West', 'Seme', 'Nyakach', 'Nyando', 'Muhoroni'],
  },
  {
    id: 'PI-08',
    name: 'Coverage Gap Response',
    description: 'Percentage of flagged service coverage gaps with outreach planned within 14 days',
    currentValue: 54.0,
    baselineValue: 22.0,
    targetValue: 80,
    unit: '%',
    trend: 'improving',
    status: 'At Risk',
    subCounties: ['Kisumu Central', 'Kisumu East', 'Kisumu West', 'Seme', 'Nyakach', 'Nyando', 'Muhoroni'],
  },
]

export const pilotTrendData = {
  timeliness: [76, 78, 80, 82, 84, 86, 87, 89],
  completeness: [84, 86, 87, 88, 89, 90, 91, 92],
  verificationTime: [18.5, 16.2, 14.8, 12.5, 10.3, 8.7, 6.2, 4.2],
  mape: [28.3, 26.1, 24.5, 22.8, 20.4, 18.9, 16.5, 14.8],
  activeUsers: [23, 26, 29, 32, 36, 40, 44, 47],
  signalActionRate: [41, 46, 51, 56, 61, 66, 70, 73],
  stockoutPrevention: [34, 38, 42, 47, 51, 55, 59, 63],
  coverageGapResponse: [22, 27, 31, 36, 41, 46, 50, 54],
}

export const pilotMESummary: PilotMESummary = {
  reportingPeriod: 'Weeks 35-42, 2026',
  activePilotSubCounties: 7,
  totalFacilitiesInPilot: 261,
  weeklyActiveUsers: 47,
}

export const subCountyPilotPerformance = [
  { subCounty: 'Kisumu Central', timeliness: 93.2, completeness: 95.8, verificationTime: 3.1, mape: 12.4, activeUsers: 12, signalActionRate: 81.5, stockoutPrevention: 70.0, coverageGapResponse: 68.0 },
  { subCounty: 'Kisumu East', timeliness: 90.5, completeness: 94.2, verificationTime: 3.8, mape: 13.1, activeUsers: 8, signalActionRate: 78.2, stockoutPrevention: 68.0, coverageGapResponse: 64.0 },
  { subCounty: 'Kisumu West', timeliness: 89.8, completeness: 93.5, verificationTime: 4.2, mape: 14.0, activeUsers: 7, signalActionRate: 75.0, stockoutPrevention: 65.0, coverageGapResponse: 60.0 },
  { subCounty: 'Seme', timeliness: 87.2, completeness: 91.8, verificationTime: 4.8, mape: 15.2, activeUsers: 5, signalActionRate: 70.5, stockoutPrevention: 60.0, coverageGapResponse: 52.0 },
  { subCounty: 'Nyakach', timeliness: 85.5, completeness: 90.2, verificationTime: 5.2, mape: 16.8, activeUsers: 5, signalActionRate: 68.0, stockoutPrevention: 55.0, coverageGapResponse: 44.0 },
  { subCounty: 'Nyando', timeliness: 88.0, completeness: 92.0, verificationTime: 4.5, mape: 15.5, activeUsers: 6, signalActionRate: 72.0, stockoutPrevention: 62.0, coverageGapResponse: 50.0 },
  { subCounty: 'Muhoroni', timeliness: 86.8, completeness: 91.0, verificationTime: 5.0, mape: 17.2, activeUsers: 4, signalActionRate: 65.0, stockoutPrevention: 52.0, coverageGapResponse: 40.0 },
]
/**
 * The pilot is only as healthy as its weakest indicator: Off Track if any
 * indicator is off track, At Risk if any is at risk, otherwise On Track.
 */
export function overallPilotStatus(indicators: PilotIndicator[] = pilotIndicators): PilotIndicator['status'] {
  if (indicators.some((i) => i.status === 'Off Track')) return 'Off Track'
  if (indicators.some((i) => i.status === 'At Risk')) return 'At Risk'
  return 'On Track'
}
