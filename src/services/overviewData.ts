export type AlertLevel = 'critical' | 'high' | 'moderate' | 'low'
export type AlertState = 'Unverified' | 'Under investigation' | 'Confirmed' | 'Dismissed'

export type CountyAlert = {
  name: string
  facilities: number
  alertLevel: AlertLevel
  riskIndex: number
  trend: string
}

export type LatestAlert = {
  id: string
  title: string
  subCounty: string
  disease: string
  level: AlertLevel
  count: number
  threshold: number
  state: AlertState
  officer: string
  age: string
}

export type OverviewData = {
  generatedAt: string
  lastSynced: string
  facilitySnapshot: {
    totalFacilities: number
    governmentOwned: number
    communityUnits: number
    chps: number
    households: number
  }
  metrics: {
    reportingThisWeek: number
    totalFacilities: number
    completeness: number
    timeliness: number
    openAlerts: number
    stockoutRisk: number
  }
  subCounties: CountyAlert[]
  latestAlerts: LatestAlert[]
}

export const overviewData: OverviewData = {
  generatedAt: '2026-11-10T08:30:00Z',
  lastSynced: '2026-11-10 08:30 EAT',
  facilitySnapshot: {
    totalFacilities: 261,
    governmentOwned: 138,
    communityUnits: 280,
    chps: 2998,
    households: 307185,
  },
  metrics: {
    reportingThisWeek: 242,
    totalFacilities: 261,
    completeness: 92.4,
    timeliness: 88.7,
    openAlerts: 12,
    stockoutRisk: 19,
  },
  subCounties: [
    { name: 'Kisumu Central', facilities: 48, alertLevel: 'high', riskIndex: 73, trend: '+14%' },
    { name: 'Kisumu East', facilities: 39, alertLevel: 'moderate', riskIndex: 51, trend: '+8%' },
    { name: 'Kisumu West', facilities: 32, alertLevel: 'low', riskIndex: 38, trend: '+3%' },
    { name: 'Seme', facilities: 28, alertLevel: 'moderate', riskIndex: 54, trend: '+9%' },
    { name: 'Nyakach', facilities: 34, alertLevel: 'critical', riskIndex: 86, trend: '+21%' },
    { name: 'Nyando', facilities: 42, alertLevel: 'high', riskIndex: 68, trend: '+16%' },
    { name: 'Muhoroni', facilities: 38, alertLevel: 'critical', riskIndex: 82, trend: '+18%' },
  ],
  latestAlerts: [
    {
      id: 'SIG-1048',
      title: 'Diarrhoeal disease spike above expected range',
      subCounty: 'Nyakach',
      disease: 'Diarrhoeal disease',
      level: 'critical',
      count: 136,
      threshold: 96,
      state: 'Under investigation',
      officer: 'Dr. Akinyi',
      age: '2 hours ago',
    },
    {
      id: 'SIG-1043',
      title: 'Malaria trend elevated in sentinel facilities',
      subCounty: 'Muhoroni',
      disease: 'Malaria',
      level: 'high',
      count: 208,
      threshold: 162,
      state: 'Unverified',
      officer: 'Mr. Ouma',
      age: '5 hours ago',
    },
    {
      id: 'SIG-1037',
      title: 'Acute respiratory infection remains above baseline',
      subCounty: 'Kisumu Central',
      disease: 'Acute respiratory infection',
      level: 'moderate',
      count: 177,
      threshold: 144,
      state: 'Confirmed',
      officer: 'Dr. Wekesa',
      age: '1 day ago',
    },
    {
      id: 'SIG-1031',
      title: 'Malaria RDT stockout risk cluster',
      subCounty: 'Muhoroni',
      disease: 'Commodity risk',
      level: 'high',
      count: 14,
      threshold: 8,
      state: 'Under investigation',
      officer: 'A. Otieno',
      age: '1 day ago',
    },
    {
      id: 'SIG-1027',
      title: 'Suspected cholera signal not sustained',
      subCounty: 'Seme',
      disease: 'Suspected cholera',
      level: 'low',
      count: 19,
      threshold: 23,
      state: 'Dismissed',
      officer: 'Ms. Mola',
      age: '2 days ago',
    },
  ],
}
