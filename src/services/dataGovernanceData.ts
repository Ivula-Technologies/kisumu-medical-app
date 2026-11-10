export type DataSource = {
  name: string
  type: 'Facility EMR' | 'Community Reporting' | 'Aggregate Reporting'
  status: 'Connected' | 'Degraded' | 'Disconnected'
  lastSync: string
  recordsSynced: number
  facilitiesCovered: number
  syncFrequency: string
}

export type RolePermission = {
  role: string
  description: string
  permissions: string[]
  userCount: number
  lastAccess: string
}

export type AccessLogEntry = {
  timestamp: string
  user: string
  role: string
  action: string
  resource: string
  ip: string
  status: 'Success' | 'Failed'
}

export type DataGovernanceNote = {
  id: string
  category: 'Data Minimisation' | 'AI Provenance' | 'Human Confirmation' | 'Access Control' | 'Retention'
  title: string
  description: string
  status: 'Implemented' | 'In Progress' | 'Planned'
  reference: string
}

export const dataSources: DataSource[] = [
  {
    name: 'eCHIS',
    type: 'Community Reporting',
    status: 'Connected',
    lastSync: '2026-11-10 07:45 EAT',
    recordsSynced: 15840,
    facilitiesCovered: 280,
    syncFrequency: 'Every 15 minutes',
  },
  {
    name: 'KenyaEMR',
    type: 'Facility EMR',
    status: 'Connected',
    lastSync: '2026-11-10 08:10 EAT',
    recordsSynced: 42350,
    facilitiesCovered: 138,
    syncFrequency: 'Hourly',
  },
  {
    name: 'KHIS',
    type: 'Aggregate Reporting',
    status: 'Connected',
    lastSync: '2026-11-10 08:30 EAT',
    recordsSynced: 8920,
    facilitiesCovered: 261,
    syncFrequency: 'Daily at 02:00 EAT',
  },
]

export const rolePermissions: RolePermission[] = [
  {
    role: 'County Health Manager',
    description: 'Full access across all sub-counties and facilities',
    permissions: [
      'View all dashboards and reports',
      'Export data (CSV/PDF)',
      'Manage signal review workflow',
      'Approve commodity redistributions',
      'Configure alert thresholds',
      'Manage user accounts and roles',
      'View audit logs and access logs',
    ],
    userCount: 3,
    lastAccess: '2026-11-10 08:15 EAT',
  },
  {
    role: 'Sub-County Officer',
    description: 'Access limited to assigned sub-county',
    permissions: [
      'View sub-county dashboards',
      'Review and update signal status',
      'Add notes to signals',
      'View facility-level data for assigned sub-county',
      'Export sub-county data',
    ],
    userCount: 7,
    lastAccess: '2026-11-10 07:50 EAT',
  },
  {
    role: 'Facility In-charge',
    description: 'Access limited to assigned facility',
    permissions: [
      'View facility dashboard',
      'Update facility reporting status',
      'View commodity stock for facility',
      'Acknowledge alerts for facility',
    ],
    userCount: 138,
    lastAccess: '2026-11-09 16:30 EAT',
  },
  {
    role: 'Admin',
    description: 'System configuration and user management',
    permissions: [
      'Manage user accounts and roles',
      'Configure data source connections',
      'Set alert thresholds and baselines',
      'Manage retention policies',
      'View system health and logs',
    ],
    userCount: 2,
    lastAccess: '2026-11-10 06:00 EAT',
  },
]

export const accessLog: AccessLogEntry[] = [
  { timestamp: '2026-11-10 08:25:12', user: 'Dr. Akinyi', role: 'Sub-County Officer', action: 'View Signal Details', resource: 'SIG-1048', ip: '192.168.1.45', status: 'Success' },
  { timestamp: '2026-11-10 08:22:03', user: 'Mr. Ouma', role: 'Sub-County Officer', action: 'Update Signal Status', resource: 'SIG-1043', ip: '192.168.1.52', status: 'Success' },
  { timestamp: '2026-11-10 08:18:45', user: 'County Health Manager', role: 'County Health Manager', action: 'Export CSV', resource: 'Overview Dashboard', ip: '192.168.1.10', status: 'Success' },
  { timestamp: '2026-11-10 08:15:30', user: 'Dr. Wekesa', role: 'Sub-County Officer', action: 'Add Note to Signal', resource: 'SIG-1037', ip: '192.168.1.38', status: 'Success' },
  { timestamp: '2026-11-10 08:12:10', user: 'A. Otieno', role: 'Sub-County Officer', action: 'View Commodity Forecast', resource: 'Malaria RDT', ip: '192.168.1.41', status: 'Success' },
  { timestamp: '2026-11-10 08:05:22', user: 'Ms. Mola', role: 'Sub-County Officer', action: 'Dismiss Signal', resource: 'SIG-1027', ip: '192.168.1.33', status: 'Success' },
  { timestamp: '2026-11-10 07:58:14', user: 'System Sync', role: 'System', action: 'Data Sync', resource: 'eCHIS', ip: 'internal', status: 'Success' },
  { timestamp: '2026-11-10 07:45:00', user: 'System Sync', role: 'System', action: 'Data Sync', resource: 'KenyaEMR', ip: 'internal', status: 'Success' },
  { timestamp: '2026-11-10 07:30:00', user: 'Admin User', role: 'Admin', action: 'Update Threshold', resource: 'Malaria Alert Threshold', ip: '192.168.1.5', status: 'Success' },
  { timestamp: '2026-11-10 07:15:00', user: 'System Sync', role: 'System', action: 'Data Sync', resource: 'KHIS', ip: 'internal', status: 'Success' },
]

export const governanceNotes: DataGovernanceNote[] = [
  {
    id: 'DG-01',
    category: 'Data Minimisation',
    title: 'Aggregated data only',
    description: 'All dashboards and analytics operate on aggregated facility and sub-county level data. No patient-level identifiers are stored or processed in this system.',
    status: 'Implemented',
    reference: 'Kenya Data Protection Act 2019, Section 25',
  },
  {
    id: 'DG-02',
    category: 'Data Minimisation',
    title: 'Purpose-limited data collection',
    description: 'Data is collected only for the two specified use cases: disease signal detection and commodity forecasting. No secondary uses without explicit consent.',
    status: 'Implemented',
    reference: 'Digital Health Act 2023, Section 12',
  },
  {
    id: 'DG-03',
    category: 'AI Provenance',
    title: 'AI output labelling',
    description: 'Every AI-generated signal, forecast, and summary is clearly labelled with the model version, input data period, and confidence metrics.',
    status: 'Implemented',
    reference: 'WHO Guidance on Ethics & Governance of AI for Health',
  },
  {
    id: 'DG-04',
    category: 'AI Provenance',
    title: 'Model transparency log',
    description: 'Rolling baseline and z-score methodology for signals; seasonal naive and Holt-Winters for forecasts. All methods documented and auditable.',
    status: 'Implemented',
    reference: 'Internal methodology document v2.1',
  },
  {
    id: 'DG-05',
    category: 'Human Confirmation',
    title: 'Mandatory human verification',
    description: 'All AI-generated signals require human review and confirmation before any public health action is taken. Signals are not auto-actioned.',
    status: 'Implemented',
    reference: 'Kenya Digital Health Act 2023, Section 18',
  },
  {
    id: 'DG-06',
    category: 'Human Confirmation',
    title: 'Audit trail for all decisions',
    description: 'Every signal review decision (verify, dismiss, escalate) is logged with timestamp, officer, and rationale. Immutable audit trail.',
    status: 'Implemented',
    reference: 'Internal SOP-DS-004',
  },
  {
    id: 'DG-07',
    category: 'Access Control',
    title: 'Role-based access control (RBAC)',
    description: 'Four roles with row-level security: County Health Manager (all), Sub-County Officer (assigned sub-county), Facility In-charge (assigned facility), Admin (system config).',
    status: 'Implemented',
    reference: 'KHIS Security Framework v3.0',
  },
  {
    id: 'DG-08',
    category: 'Access Control',
    title: 'Multi-factor authentication',
    description: 'MFA enforced for County Health Manager and Admin roles. Planned rollout for all roles by Q2 2027.',
    status: 'In Progress',
    reference: 'ICT Authority MFA Directive 2024',
  },
  {
    id: 'DG-09',
    category: 'Retention',
    title: 'Data retention policy',
    description: 'Operational data retained for 5 years. Audit logs retained for 7 years. AI model inputs/outputs retained for 3 years. Automated purge scheduled monthly.',
    status: 'Planned',
    reference: 'Kenya Data Protection Act 2019, Section 42',
  },
  {
    id: 'DG-10',
    category: 'Retention',
    title: 'Right to erasure process',
    description: 'Process defined for data subject requests. Not applicable to aggregated demo data. Will be operationalised for production with identifiable data.',
    status: 'Planned',
    reference: 'Kenya Data Protection Act 2019, Section 26',
  },
]

export const dataGovernanceSummary = {
  lastReviewed: '2026-11-10',
  nextReview: '2027-02-10',
  complianceScore: 87,
  criticalGaps: 2,
  notesImplemented: 6,
  notesInProgress: 2,
  notesPlanned: 2,
}