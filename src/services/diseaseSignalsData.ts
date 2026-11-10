export type DiseaseSignal = {
  disease: string
  subCounty: string
  currentWeek: string
  actual: number
  expectedMin: number
  expectedMax: number
  baselineMean: number
  zScore: number
  level: 'critical' | 'high' | 'moderate' | 'low'
  status: 'Unverified' | 'Under investigation' | 'Confirmed' | 'Dismissed'
  assignedOfficer: string
  whyFlagged: string
  notes: string
  auditTrail: string[]
}

export const diseaseSignals: DiseaseSignal[] = [
  {
    disease: 'Malaria',
    subCounty: 'Nyakach',
    currentWeek: 'Week 42',
    actual: 168,
    expectedMin: 92,
    expectedMax: 118,
    baselineMean: 105,
    zScore: 2.9,
    level: 'critical',
    status: 'Unverified',
    assignedOfficer: 'Dr. Akinyi',
    whyFlagged:
      'Weekly malaria counts in Nyakach rose to 168, above the rolling 8-week mean of 105 and above the expected range for the last 8 weeks.',
    notes:
      'Cluster seen in sentinel facilities and community reporting units over the last two weeks.',
    auditTrail: [
      '2026-11-10 07:15 — AI signal generated from weekly case count and rolling baseline.',
      '2026-11-10 08:00 — Alert assigned to sub-county officer for review.',
      '2026-11-10 08:30 — Signal visible to county response team for verification.',
    ],
  },
  {
    disease: 'Diarrhoeal disease',
    subCounty: 'Nyakach',
    currentWeek: 'Week 42',
    actual: 136,
    expectedMin: 78,
    expectedMax: 96,
    baselineMean: 87,
    zScore: 2.7,
    level: 'critical',
    status: 'Under investigation',
    assignedOfficer: 'Mr. Ouma',
    whyFlagged:
      'Diarrhoeal disease counts exceeded expected seasonal range after a sustained rise in the last 3 reporting weeks.',
    notes:
      'High-risk facilities are being checked for water or sanitation interruptions.',
    auditTrail: [
      '2026-11-10 06:40 — AI signal generated from weekly case trend.',
      '2026-11-10 07:20 — Public health nurse assigned to field review.',
    ],
  },
  {
    disease: 'Acute respiratory infection',
    subCounty: 'Kisumu Central',
    currentWeek: 'Week 41',
    actual: 177,
    expectedMin: 124,
    expectedMax: 144,
    baselineMean: 134,
    zScore: 2.1,
    level: 'high',
    status: 'Confirmed',
    assignedOfficer: 'Dr. Wekesa',
    whyFlagged:
      'Acute respiratory infection counts remained elevated above baseline for more than 2 consecutive weeks in Kisumu Central.',
    notes:
      'The signal was reviewed and confirmed by the sub-county team after facility validations.',
    auditTrail: [
      '2026-11-08 15:00 — Signal raised by the model.',
      '2026-11-09 09:30 — Confirmed by facility review team.',
      '2026-11-09 11:00 — Added to response tracker.',
    ],
  },
  {
    disease: 'Suspected cholera',
    subCounty: 'Seme',
    currentWeek: 'Week 39',
    actual: 19,
    expectedMin: 16,
    expectedMax: 23,
    baselineMean: 19,
    zScore: 0.8,
    level: 'low',
    status: 'Dismissed',
    assignedOfficer: 'Ms. Mola',
    whyFlagged:
      'There was a short-lived increase, but the weekly count remained within the expected range and did not sustain above baseline.',
    notes:
      'No additional evidence sustained the signal after cross-checking community reports.',
    auditTrail: [
      '2026-11-02 12:25 — AI signal generated.',
      '2026-11-03 09:10 — Dismissed after follow-up review.',
    ],
  },
  {
    disease: 'Suspected measles',
    subCounty: 'Muhoroni',
    currentWeek: 'Week 42',
    actual: 12,
    expectedMin: 3,
    expectedMax: 8,
    baselineMean: 6,
    zScore: 2.3,
    level: 'moderate',
    status: 'Under investigation',
    assignedOfficer: 'A. Otieno',
    whyFlagged:
      'A small but rising cluster in Muhoroni exceeded the expected weekly range despite low baseline counts.',
    notes:
      'Sub-county team is checking immunisation records and missed routine visits.',
    auditTrail: [
      '2026-11-10 05:45 — AI signal generated.',
      '2026-11-10 06:10 — Action assigned to district focal person.',
    ],
  },
]

export const diseaseTrendSummary = [
  { disease: 'Malaria', weeklyCounts: [74, 81, 76, 92, 119, 108, 132, 168] },
  { disease: 'Diarrhoeal disease', weeklyCounts: [52, 58, 67, 64, 83, 91, 109, 136] },
  { disease: 'Acute respiratory infection', weeklyCounts: [104, 115, 122, 131, 128, 142, 155, 177] },
  { disease: 'Suspected measles', weeklyCounts: [3, 4, 6, 5, 9, 10, 11, 12] },
  { disease: 'Suspected cholera', weeklyCounts: [7, 8, 9, 11, 13, 15, 18, 19] },
]
