// Governance register for the referral and linkage pilot. Synthetic demo content.

const NOW = Date.now()
const ago = (hours: number) => new Date(NOW - hours * 3_600_000).toISOString()

export interface RoleAccess {
  role: string
  sees: string
  can: string[]
  cannot: string
  users: number
}

export const roleAccess: RoleAccess[] = [
  {
    role: 'Community Health Promoter',
    sees: 'Their own referrals: status, appointment and feedback',
    can: ['Screen with approved tools', 'Create referrals', 'Raise emergency escalations', 'Record tracing after a missed visit'],
    cannot: 'See other CHPs’ clients or clinical notes',
    users: 480,
  },
  {
    role: 'Facility clinician',
    sees: 'Referrals sent to their facility, with screening results',
    can: ['Accept or decline', 'Book and rebook appointments', 'Record attendance', 'Send feedback to the referrer', 'Draft notes with AI'],
    cannot: 'See referrals to other facilities',
    users: 46,
  },
  {
    role: 'County mental health coordinator',
    sees: 'The whole pathway, pseudonymised, and aggregated reports',
    can: ['Redirect declined referrals', 'Follow up stalled referrals', 'Oversee escalations', 'Draft weekly briefs'],
    cannot: 'See names or clinical notes',
    users: 3,
  },
  {
    role: 'System administrator',
    sees: 'Configuration and user accounts',
    can: ['Manage accounts and roles', 'Update the referral directory'],
    cannot: 'See any client record',
    users: 2,
  },
]

export type ControlStatus = 'Implemented' | 'In progress' | 'Planned'

export interface Control {
  id: string
  area: string
  control: string
  detail: string
  status: ControlStatus
  reference: string
}

export const controls: Control[] = [
  { id: 'GV-01', area: 'Data protection', control: 'Data Protection Impact Assessment', detail: 'Completed and approved before any real personal health data is processed.', status: 'Planned', reference: 'Data Protection Act 2019, s.31' },
  { id: 'GV-02', area: 'Consent', control: 'Consent recorded before a referral is shared', detail: 'The referral cannot be sent until consent is ticked. Emergencies are never blocked by consent.', status: 'Implemented', reference: 'Data Protection Act 2019, s.30 and s.32' },
  { id: 'GV-03', area: 'Data minimisation', control: 'Pseudonymous referral records', detail: 'Referrals carry an ID, age band, sex and settlement. Names and phone numbers stay in eCHIS and KenyaEMR.', status: 'Implemented', reference: 'Data Protection Act 2019, s.25' },
  { id: 'GV-04', area: 'Access', control: 'Role-based views', detail: 'Each role sees only its part of the pathway. Sign-in and enforced access control replace the demo role switch.', status: 'In progress', reference: 'Digital Health Act 2023' },
  { id: 'GV-05', area: 'Patient safety', control: 'Emergencies always go to a person', detail: 'Suicide risk, psychosis and risk of harm trigger a phone escalation, never a queued referral or a message.', status: 'Implemented', reference: 'County referral protocol' },
  { id: 'GV-06', area: 'Responsible AI', control: 'AI drafts, people decide', detail: 'Tiers and destinations come from fixed rules. The model only drafts notes and briefs, labelled for review.', status: 'Implemented', reference: 'Concept note, principle (c)' },
  { id: 'GV-07', area: 'Clinical validation', control: 'Referral rules aligned and approved', detail: 'Rules now follow the 2024 national guidelines wherever they specify one (ASQ, CAGE-AID, GAD-7, emergencies, linkage calls). The remaining placeholders need County Mental Health Technical Team sign-off.', status: 'In progress', reference: 'National Clinical Guidelines 2024' },
  { id: 'GV-08', area: 'Fairness', control: 'Bias assessment', detail: 'Compare false positives and negatives by age, sex and settlement before and during the pilot.', status: 'Planned', reference: 'Concept note, M&E framework' },
  { id: 'GV-09', area: 'Safeguarding', control: 'Extra protection for minors and survivors of violence', detail: 'Guardian involvement rules, child protection referral and restricted visibility.', status: 'In progress', reference: 'Children Act 2022' },
  { id: 'GV-10', area: 'Security', control: 'Encryption, audit trail and secure sign-in', detail: 'Every referral action is already logged with who and when. Encryption and sign-in come with production hosting.', status: 'In progress', reference: 'Digital Health Act 2023' },
  { id: 'GV-11', area: 'Interoperability', control: 'Exchange with eCHIS and KenyaEMR', detail: 'Through approved interfaces and the County Health Information Exchange once available.', status: 'Planned', reference: 'Digital Health Agency certification' },
  { id: 'GV-12', area: 'Retention', control: 'Retention and deletion schedule', detail: 'Agreed with the county before go-live, with deletion on request where the law allows.', status: 'Planned', reference: 'Data Protection Act 2019, s.39–40' },
]

export interface AccessEntry {
  at: string
  user: string
  role: string
  action: string
  record: string
}

export const accessLog: AccessEntry[] = [
  { at: ago(0.4), user: 'CHP-KON-009', role: 'CHP', action: 'Raised emergency escalation', record: 'ESC-118' },
  { at: ago(3), user: 'CHP-OBU-014', role: 'CHP', action: 'Created referral', record: 'REF-2044' },
  { at: ago(5), user: 'Lumumba clinician', role: 'Facility clinician', action: 'Viewed referral', record: 'REF-2042' },
  { at: ago(8), user: 'County Referral clinician', role: 'Facility clinician', action: 'Marked appointment missed', record: 'REF-2032' },
  { at: ago(20), user: 'JOOTRH clinician', role: 'Facility clinician', action: 'Sent feedback to referrer', record: 'REF-2038' },
  { at: ago(25), user: 'Lumumba clinician', role: 'Facility clinician', action: 'Booked appointment', record: 'REF-2043' },
  { at: ago(26), user: 'County coordinator', role: 'County coordinator', action: 'Viewed escalation', record: 'ESC-117' },
  { at: ago(30), user: 'County coordinator', role: 'County coordinator', action: 'Exported pathway report', record: 'Aggregated' },
]
