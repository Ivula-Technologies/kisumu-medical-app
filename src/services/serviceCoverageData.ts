// Synthetic, aggregated service coverage data for the Kisumu demo.
// Coverage = services delivered / expected eligible population for the period.

export type CoverageIndicatorId = 'householdVisits' | 'anc4' | 'skilledBirth' | 'fullyImmunised'

export type CoverageIndicator = {
  id: CoverageIndicatorId
  name: string
  short: string
  description: string
  source: string
  target: number
  /** County coverage for the last six months, oldest first. */
  trend: number[]
}

export type SubCountyCoverage = {
  subCounty: string
  households: number
  communityUnits: number
  chps: number
  coverage: Record<CoverageIndicatorId, number>
}

export type GapStatus = 'Unreviewed' | 'Outreach planned' | 'Resolved'

export type CoverageGap = {
  id: string
  subCounty: string
  area: string
  indicator: CoverageIndicatorId
  coverage: number
  /** Coverage for the last three months, oldest first. */
  recent: number[]
  communityUnits: number
  households: number
  whyFlagged: string
  suggestedAction: string
  status: GapStatus
}

export const coverageIndicators: CoverageIndicator[] = [
  {
    id: 'householdVisits',
    name: 'Household visits',
    short: 'Household visits',
    description: 'Households visited by a community health promoter at least once in the month',
    source: 'eCHIS',
    target: 80,
    trend: [69, 70, 72, 71, 73, 75],
  },
  {
    id: 'anc4',
    name: 'Antenatal care, 4+ visits',
    short: 'ANC 4+',
    description: 'Pregnant women completing four or more antenatal visits',
    source: 'KHIS',
    target: 70,
    trend: [58, 59, 61, 62, 62, 64],
  },
  {
    id: 'skilledBirth',
    name: 'Skilled birth attendance',
    short: 'Skilled birth',
    description: 'Deliveries attended by a skilled health worker',
    source: 'KHIS',
    target: 85,
    trend: [79, 80, 80, 81, 82, 83],
  },
  {
    id: 'fullyImmunised',
    name: 'Fully immunised children',
    short: 'Immunisation',
    description: 'Children under one year who received all scheduled vaccines',
    source: 'KHIS',
    target: 90,
    trend: [86, 86, 85, 84, 84, 83],
  },
]

export const subCountyCoverage: SubCountyCoverage[] = [
  { subCounty: 'Kisumu Central', households: 62410, communityUnits: 48, chps: 520, coverage: { householdVisits: 86, anc4: 74, skilledBirth: 93, fullyImmunised: 91 } },
  { subCounty: 'Kisumu East', households: 55230, communityUnits: 44, chps: 470, coverage: { householdVisits: 82, anc4: 71, skilledBirth: 90, fullyImmunised: 88 } },
  { subCounty: 'Kisumu West', households: 41875, communityUnits: 40, chps: 425, coverage: { householdVisits: 79, anc4: 66, skilledBirth: 86, fullyImmunised: 87 } },
  { subCounty: 'Seme', households: 31640, communityUnits: 32, chps: 345, coverage: { householdVisits: 71, anc4: 49, skilledBirth: 78, fullyImmunised: 83 } },
  { subCounty: 'Nyakach', households: 38950, communityUnits: 38, chps: 405, coverage: { householdVisits: 64, anc4: 58, skilledBirth: 74, fullyImmunised: 68 } },
  { subCounty: 'Nyando', households: 42180, communityUnits: 42, chps: 450, coverage: { householdVisits: 73, anc4: 61, skilledBirth: 71, fullyImmunised: 80 } },
  { subCounty: 'Muhoroni', households: 34900, communityUnits: 36, chps: 383, coverage: { householdVisits: 54, anc4: 57, skilledBirth: 76, fullyImmunised: 77 } },
]

export const coverageGaps: CoverageGap[] = [
  {
    id: 'GAP-207',
    subCounty: 'Muhoroni',
    area: 'Chemelil and Miwani wards',
    indicator: 'householdVisits',
    coverage: 41,
    recent: [52, 47, 41],
    communityUnits: 9,
    households: 8640,
    whyFlagged:
      'Household visit coverage in 9 community units fell to 41%, against a target of 80%, and has dropped for three months in a row.',
    suggestedAction:
      'Check promoter activity and eCHIS sync in the 9 units, then schedule supervised catch-up visits.',
    status: 'Unreviewed',
  },
  {
    id: 'GAP-204',
    subCounty: 'Nyakach',
    area: 'South West Nyakach ward',
    indicator: 'fullyImmunised',
    coverage: 59,
    recent: [66, 63, 59],
    communityUnits: 7,
    households: 6920,
    whyFlagged:
      'Full immunisation coverage in 7 community units is 59%, 31 points below target, with three consecutive monthly declines.',
    suggestedAction:
      'Plan an integrated outreach session and defaulter tracing through promoters. Cross-check with the suspected measles signal.',
    status: 'Unreviewed',
  },
  {
    id: 'GAP-198',
    subCounty: 'Seme',
    area: 'West Seme ward',
    indicator: 'anc4',
    coverage: 38,
    recent: [42, 40, 38],
    communityUnits: 6,
    households: 5310,
    whyFlagged:
      'Only 38% of pregnant women in 6 community units completed four antenatal visits, against a target of 70%.',
    suggestedAction:
      'Have promoters register pregnancies earlier in eCHIS and refer for a first visit before 16 weeks.',
    status: 'Outreach planned',
  },
  {
    id: 'GAP-195',
    subCounty: 'Nyando',
    area: 'Kabonyo/Kanyagwal ward',
    indicator: 'skilledBirth',
    coverage: 62,
    recent: [67, 65, 62],
    communityUnits: 5,
    households: 4780,
    whyFlagged:
      'Skilled birth attendance in 5 community units is 62%, 23 points below target, after seasonal flooding cut road access.',
    suggestedAction:
      'Review referral transport for the flood-prone units and confirm maternity cover at the nearest facility.',
    status: 'Outreach planned',
  },
  {
    id: 'GAP-189',
    subCounty: 'Nyakach',
    area: 'North Nyakach ward',
    indicator: 'householdVisits',
    coverage: 57,
    recent: [58, 56, 57],
    communityUnits: 8,
    households: 7450,
    whyFlagged:
      'Household visit coverage in 8 community units has stayed near 57% for three months, 23 points below target.',
    suggestedAction: 'Review promoter-to-household ratios in the 8 units and rebalance assignments.',
    status: 'Unreviewed',
  },
  {
    id: 'GAP-176',
    subCounty: 'Kisumu West',
    area: 'North West Kisumu ward',
    indicator: 'anc4',
    coverage: 58,
    recent: [54, 56, 58],
    communityUnits: 4,
    households: 3890,
    whyFlagged:
      'Antenatal coverage in 4 community units is 58%, 12 points below target, but has improved for three months.',
    suggestedAction: 'Keep the current outreach schedule and review again next month.',
    status: 'Resolved',
  },
]

export const coverageSummary = {
  period: 'October 2026',
  households: 307185,
  communityUnits: 280,
  chps: 2998,
}
