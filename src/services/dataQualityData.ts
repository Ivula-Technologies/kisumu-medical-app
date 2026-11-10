export type SourceSystem = 'eCHIS' | 'KenyaEMR' | 'KHIS'

export type DataQualityIssue = {
  facility: string
  subCounty: string
  source: SourceSystem
  issue: string
  severity: 'Critical' | 'High' | 'Moderate' | 'Low'
  daysSinceReport: number
}

export type FacilityReporting = {
  facility: string
  subCounty: string
  source: SourceSystem
  lastReport: string
  completeness: number
  timeliness: number
  validationStatus: 'Passed' | 'Failed' | 'Pending'
  issuesCount: number
}

export type SourceQuality = {
  source: SourceSystem
  facilitiesConnected: number
  facilitiesReporting: number
  completeness: number
  timeliness: number
  lastSync: string
  validationErrors: number
}

export const sourceQuality: SourceQuality[] = [
  {
    source: 'eCHIS',
    facilitiesConnected: 280,
    facilitiesReporting: 265,
    completeness: 94.6,
    timeliness: 89.2,
    lastSync: '2026-11-10 07:45 EAT',
    validationErrors: 12,
  },
  {
    source: 'KenyaEMR',
    facilitiesConnected: 138,
    facilitiesReporting: 128,
    completeness: 92.8,
    timeliness: 87.5,
    lastSync: '2026-11-10 08:10 EAT',
    validationErrors: 8,
  },
  {
    source: 'KHIS',
    facilitiesConnected: 261,
    facilitiesReporting: 242,
    completeness: 92.7,
    timeliness: 88.7,
    lastSync: '2026-11-10 08:30 EAT',
    validationErrors: 19,
  },
]

export const facilityReporting: FacilityReporting[] = [
  { facility: 'Nyakach Sub-County Hospital', subCounty: 'Nyakach', source: 'KenyaEMR', lastReport: '2026-11-09', completeness: 96.2, timeliness: 92.0, validationStatus: 'Passed', issuesCount: 0 },
  { facility: 'Muhoroni Sub-County Hospital', subCounty: 'Muhoroni', source: 'KenyaEMR', lastReport: '2026-11-09', completeness: 94.8, timeliness: 90.5, validationStatus: 'Passed', issuesCount: 0 },
  { facility: 'Nyando Sub-County Hospital', subCounty: 'Nyando', source: 'KenyaEMR', lastReport: '2026-11-09', completeness: 95.5, timeliness: 91.2, validationStatus: 'Passed', issuesCount: 0 },
  { facility: 'Kisumu County Referral Hospital', subCounty: 'Kisumu Central', source: 'KenyaEMR', lastReport: '2026-11-09', completeness: 98.1, timeliness: 95.0, validationStatus: 'Passed', issuesCount: 0 },
  { facility: 'Jaramogi Oginga Odinga Hospital', subCounty: 'Kisumu Central', source: 'KenyaEMR', lastReport: '2026-11-09', completeness: 97.5, timeliness: 94.3, validationStatus: 'Passed', issuesCount: 0 },
  { facility: 'Seme Sub-County Hospital', subCounty: 'Seme', source: 'KenyaEMR', lastReport: '2026-11-08', completeness: 91.2, timeliness: 85.0, validationStatus: 'Passed', issuesCount: 1 },
  { facility: 'Kisumu East Sub-County Hospital', subCounty: 'Kisumu East', source: 'KenyaEMR', lastReport: '2026-11-09', completeness: 93.8, timeliness: 88.5, validationStatus: 'Passed', issuesCount: 0 },
  { facility: 'Kisumu West Sub-County Hospital', subCounty: 'Kisumu West', source: 'KenyaEMR', lastReport: '2026-11-09', completeness: 94.2, timeliness: 89.0, validationStatus: 'Passed', issuesCount: 0 },
  { facility: 'Ahero County Hospital', subCounty: 'Nyando', source: 'KenyaEMR', lastReport: '2026-11-09', completeness: 92.5, timeliness: 87.8, validationStatus: 'Passed', issuesCount: 0 },
  { facility: 'Kombewa Hospital', subCounty: 'Seme', source: 'KenyaEMR', lastReport: '2026-11-07', completeness: 88.4, timeliness: 82.0, validationStatus: 'Failed', issuesCount: 3 },
  { facility: 'Masogo Health Centre', subCounty: 'Muhoroni', source: 'eCHIS', lastReport: '2026-11-09', completeness: 95.0, timeliness: 90.0, validationStatus: 'Passed', issuesCount: 0 },
  { facility: 'Pap Onditi Health Centre', subCounty: 'Nyakach', source: 'eCHIS', lastReport: '2026-11-09', completeness: 94.5, timeliness: 89.5, validationStatus: 'Passed', issuesCount: 0 },
  { facility: 'Oboch Health Centre', subCounty: 'Nyakach', source: 'eCHIS', lastReport: '2026-11-06', completeness: 85.2, timeliness: 78.0, validationStatus: 'Failed', issuesCount: 4 },
  { facility: 'Katito Health Centre', subCounty: 'Nyando', source: 'eCHIS', lastReport: '2026-11-09', completeness: 93.0, timeliness: 88.0, validationStatus: 'Passed', issuesCount: 0 },
  { facility: 'Awasi Health Centre', subCounty: 'Nyando', source: 'eCHIS', lastReport: '2026-11-08', completeness: 90.5, timeliness: 85.5, validationStatus: 'Passed', issuesCount: 1 },
  { facility: 'Koru Health Centre', subCounty: 'Muhoroni', source: 'eCHIS', lastReport: '2026-11-09', completeness: 92.8, timeliness: 87.5, validationStatus: 'Passed', issuesCount: 0 },
  { facility: 'Miwani Health Centre', subCounty: 'Muhoroni', source: 'eCHIS', lastReport: '2026-11-05', completeness: 82.1, timeliness: 75.0, validationStatus: 'Failed', issuesCount: 5 },
  { facility: 'Chulaimbo Health Centre', subCounty: 'Kisumu West', source: 'eCHIS', lastReport: '2026-11-09', completeness: 94.0, timeliness: 89.2, validationStatus: 'Passed', issuesCount: 0 },
  { facility: 'Ojola Health Centre', subCounty: 'Kisumu West', source: 'eCHIS', lastReport: '2026-11-08', completeness: 91.8, timeliness: 86.0, validationStatus: 'Passed', issuesCount: 1 },
  { facility: 'Rabour Health Centre', subCounty: 'Kisumu East', source: 'eCHIS', lastReport: '2026-11-09', completeness: 93.5, timeliness: 88.8, validationStatus: 'Passed', issuesCount: 0 },
]

export const dataQualityIssues: DataQualityIssue[] = [
  { facility: 'Oboch Health Centre', subCounty: 'Nyakach', source: 'eCHIS', issue: 'Missing weekly malaria and diarrhoeal reports for 3 consecutive weeks', severity: 'Critical', daysSinceReport: 4 },
  { facility: 'Miwani Health Centre', subCounty: 'Muhoroni', source: 'eCHIS', issue: 'Incomplete ARV and TB data; validation failures on patient identifiers', severity: 'Critical', daysSinceReport: 5 },
  { facility: 'Kombewa Hospital', subCounty: 'Seme', source: 'KenyaEMR', issue: 'Duplicate encounter records; facility code mismatch in 12% of submissions', severity: 'High', daysSinceReport: 3 },
  { facility: 'Awasi Health Centre', subCounty: 'Nyando', source: 'eCHIS', issue: 'Late reporting by 6 days; stock data not updated since week 40', severity: 'High', daysSinceReport: 2 },
  { facility: 'Ojola Health Centre', subCounty: 'Kisumu West', source: 'eCHIS', issue: 'Validation warnings on pregnancy outcome fields', severity: 'Moderate', daysSinceReport: 2 },
  { facility: 'Seme Sub-County Hospital', subCounty: 'Seme', source: 'KenyaEMR', issue: 'Completeness below threshold for immunisation module', severity: 'Moderate', daysSinceReport: 2 },
  { facility: 'Kisumu West Sub-County Hospital', subCounty: 'Kisumu West', source: 'KenyaEMR', issue: 'Timeliness degradation over last 3 weeks', severity: 'Moderate', daysSinceReport: 1 },
  { facility: 'Rabour Health Centre', subCounty: 'Kisumu East', source: 'eCHIS', issue: 'Minor validation warnings on age disaggregation', severity: 'Low', daysSinceReport: 1 },
]

export const facilitiesNotReporting = [
  { facility: 'Nyamware Dispensary', subCounty: 'Seme', source: 'eCHIS', daysSinceLastReport: 14 },
  { facility: 'Kasese Dispensary', subCounty: 'Nyakach', source: 'eCHIS', daysSinceLastReport: 11 },
  { facility: 'Koguta Dispensary', subCounty: 'Nyando', source: 'eCHIS', daysSinceLastReport: 10 },
  { facility: 'Chemelil Dispensary', subCounty: 'Muhoroni', source: 'eCHIS', daysSinceLastReport: 9 },
  { facility: 'Ongalo Dispensary', subCounty: 'Kisumu East', source: 'eCHIS', daysSinceLastReport: 8 },
]

export const dataQualitySummary = {
  lastUpdated: '2026-11-10 08:30 EAT',
  overallCompleteness: 92.4,
  overallTimeliness: 88.7,
  facilitiesWithIssues: 8,
  facilitiesNotReporting: 5,
  validationPassRate: 94.2,
}