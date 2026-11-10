export type Commodity = 'AL' | 'Amoxicillin DT' | 'ORS' | 'Zinc' | 'Malaria RDT'

export type RiskStatus = 'Critical' | 'High' | 'Moderate' | 'Low'

export type CommodityForecast = {
  commodity: Commodity
  unit: string
  stockOnHand: number
  monthlyConsumption: number
  monthsOfStock: number
  forecast3Month: number
  confidenceBand: { min: number; max: number }
  riskStatus: RiskStatus
  redistributionSuggestion: string
  facilitiesAtRisk: number
}

export type SubCountyStock = {
  subCounty: string
  commodity: Commodity
  stockOnHand: number
  monthsOfStock: number
  riskStatus: RiskStatus
}

export const commodityForecasts: CommodityForecast[] = [
  {
    commodity: 'AL',
    unit: 'treatment courses',
    stockOnHand: 12400,
    monthlyConsumption: 4800,
    monthsOfStock: 2.6,
    forecast3Month: 14400,
    confidenceBand: { min: 13200, max: 15600 },
    riskStatus: 'Moderate',
    redistributionSuggestion: 'Move 1,200 courses from Kisumu Central to Nyando and Nyakach',
    facilitiesAtRisk: 8,
  },
  {
    commodity: 'Amoxicillin DT',
    unit: '100-tab strips',
    stockOnHand: 3200,
    monthlyConsumption: 1100,
    monthsOfStock: 2.9,
    forecast3Month: 3300,
    confidenceBand: { min: 2970, max: 3630 },
    riskStatus: 'Moderate',
    redistributionSuggestion: 'No inter-sub-county moves needed; monitor Nyakach and Muhoroni',
    facilitiesAtRisk: 5,
  },
  {
    commodity: 'ORS',
    unit: 'sachets (1L)',
    stockOnHand: 8500,
    monthlyConsumption: 2200,
    monthsOfStock: 3.9,
    forecast3Month: 6600,
    confidenceBand: { min: 5940, max: 7260 },
    riskStatus: 'Low',
    redistributionSuggestion: 'Surplus in Kisumu East and West can cover Nyakach if needed',
    facilitiesAtRisk: 2,
  },
  {
    commodity: 'Zinc',
    unit: '10-tab blisters',
    stockOnHand: 5600,
    monthlyConsumption: 1800,
    monthsOfStock: 3.1,
    forecast3Month: 5400,
    confidenceBand: { min: 4860, max: 5940 },
    riskStatus: 'Moderate',
    redistributionSuggestion: 'Shift 400 blisters from Seme to Muhoroni',
    facilitiesAtRisk: 6,
  },
  {
    commodity: 'Malaria RDT',
    unit: 'test kits (25s)',
    stockOnHand: 1800,
    monthlyConsumption: 850,
    monthsOfStock: 2.1,
    forecast3Month: 2550,
    confidenceBand: { min: 2295, max: 2805 },
    riskStatus: 'High',
    redistributionSuggestion: 'Urgent: redistribute 300 kits from Kisumu Central to Nyando, Nyakach, Muhoroni',
    facilitiesAtRisk: 14,
  },
]

export const subCountyStock: SubCountyStock[] = [
  { subCounty: 'Kisumu Central', commodity: 'AL', stockOnHand: 3200, monthsOfStock: 3.4, riskStatus: 'Low' },
  { subCounty: 'Kisumu Central', commodity: 'Amoxicillin DT', stockOnHand: 800, monthsOfStock: 3.6, riskStatus: 'Low' },
  { subCounty: 'Kisumu Central', commodity: 'ORS', stockOnHand: 2100, monthsOfStock: 4.2, riskStatus: 'Low' },
  { subCounty: 'Kisumu Central', commodity: 'Zinc', stockOnHand: 1400, monthsOfStock: 3.8, riskStatus: 'Low' },
  { subCounty: 'Kisumu Central', commodity: 'Malaria RDT', stockOnHand: 500, monthsOfStock: 2.8, riskStatus: 'Moderate' },

  { subCounty: 'Kisumu East', commodity: 'AL', stockOnHand: 2100, monthsOfStock: 3.1, riskStatus: 'Moderate' },
  { subCounty: 'Kisumu East', commodity: 'Amoxicillin DT', stockOnHand: 600, monthsOfStock: 3.2, riskStatus: 'Moderate' },
  { subCounty: 'Kisumu East', commodity: 'ORS', stockOnHand: 1800, monthsOfStock: 4.5, riskStatus: 'Low' },
  { subCounty: 'Kisumu East', commodity: 'Zinc', stockOnHand: 900, monthsOfStock: 3.0, riskStatus: 'Moderate' },
  { subCounty: 'Kisumu East', commodity: 'Malaria RDT', stockOnHand: 300, monthsOfStock: 2.5, riskStatus: 'Moderate' },

  { subCounty: 'Kisumu West', commodity: 'AL', stockOnHand: 1800, monthsOfStock: 3.0, riskStatus: 'Moderate' },
  { subCounty: 'Kisumu West', commodity: 'Amoxicillin DT', stockOnHand: 550, monthsOfStock: 3.0, riskStatus: 'Moderate' },
  { subCounty: 'Kisumu West', commodity: 'ORS', stockOnHand: 1600, monthsOfStock: 4.0, riskStatus: 'Low' },
  { subCounty: 'Kisumu West', commodity: 'Zinc', stockOnHand: 800, monthsOfStock: 3.0, riskStatus: 'Moderate' },
  { subCounty: 'Kisumu West', commodity: 'Malaria RDT', stockOnHand: 280, monthsOfStock: 2.3, riskStatus: 'High' },

  { subCounty: 'Seme', commodity: 'AL', stockOnHand: 1400, monthsOfStock: 2.8, riskStatus: 'Moderate' },
  { subCounty: 'Seme', commodity: 'Amoxicillin DT', stockOnHand: 400, monthsOfStock: 2.9, riskStatus: 'Moderate' },
  { subCounty: 'Seme', commodity: 'ORS', stockOnHand: 1100, monthsOfStock: 3.8, riskStatus: 'Low' },
  { subCounty: 'Seme', commodity: 'Zinc', stockOnHand: 700, monthsOfStock: 2.9, riskStatus: 'Moderate' },
  { subCounty: 'Seme', commodity: 'Malaria RDT', stockOnHand: 220, monthsOfStock: 2.0, riskStatus: 'High' },

  { subCounty: 'Nyakach', commodity: 'AL', stockOnHand: 900, monthsOfStock: 1.9, riskStatus: 'Critical' },
  { subCounty: 'Nyakach', commodity: 'Amoxicillin DT', stockOnHand: 300, monthsOfStock: 1.8, riskStatus: 'Critical' },
  { subCounty: 'Nyakach', commodity: 'ORS', stockOnHand: 700, monthsOfStock: 2.5, riskStatus: 'High' },
  { subCounty: 'Nyakach', commodity: 'Zinc', stockOnHand: 500, monthsOfStock: 2.1, riskStatus: 'High' },
  { subCounty: 'Nyakach', commodity: 'Malaria RDT', stockOnHand: 150, monthsOfStock: 1.3, riskStatus: 'Critical' },

  { subCounty: 'Nyando', commodity: 'AL', stockOnHand: 1600, monthsOfStock: 2.2, riskStatus: 'High' },
  { subCounty: 'Nyando', commodity: 'Amoxicillin DT', stockOnHand: 350, monthsOfStock: 2.1, riskStatus: 'High' },
  { subCounty: 'Nyando', commodity: 'ORS', stockOnHand: 800, monthsOfStock: 2.9, riskStatus: 'Moderate' },
  { subCounty: 'Nyando', commodity: 'Zinc', stockOnHand: 600, monthsOfStock: 2.5, riskStatus: 'High' },
  { subCounty: 'Nyando', commodity: 'Malaria RDT', stockOnHand: 200, monthsOfStock: 1.6, riskStatus: 'Critical' },

  { subCounty: 'Muhoroni', commodity: 'AL', stockOnHand: 1400, monthsOfStock: 2.0, riskStatus: 'High' },
  { subCounty: 'Muhoroni', commodity: 'Amoxicillin DT', stockOnHand: 200, monthsOfStock: 1.5, riskStatus: 'Critical' },
  { subCounty: 'Muhoroni', commodity: 'ORS', stockOnHand: 400, monthsOfStock: 1.8, riskStatus: 'Critical' },
  { subCounty: 'Muhoroni', commodity: 'Zinc', stockOnHand: 700, monthsOfStock: 2.8, riskStatus: 'Moderate' },
  { subCounty: 'Muhoroni', commodity: 'Malaria RDT', stockOnHand: 150, monthsOfStock: 1.2, riskStatus: 'Critical' },
]

export const commoditySummary = {
  lastUpdated: '2026-11-10 08:30 EAT',
  dataSource: 'KenyaEMR + eLMIS sync',
  totalFacilities: 261,
  facilitiesReporting: 242,
  overallRisk: 'High' as RiskStatus,
}