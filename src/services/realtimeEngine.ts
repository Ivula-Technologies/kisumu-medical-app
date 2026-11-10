// Real-time Telemetry & Live Data Engine for Kisumu Health Intelligence
// Simulates live streaming transactions from eCHIS, KenyaEMR, KHIS & KEMSA

export interface LiveHealthEvent {
  id: string;
  timestamp: string;
  secondsAgo: number;
  subCounty: string;
  facility: string;
  category: 'surveillance' | 'commodity' | 'echis_sync' | 'audit' | 'alert';
  message: string;
  severity: 'normal' | 'info' | 'warning' | 'critical';
}

export interface FacilityLiveStatus {
  id: string;
  name: string;
  subCounty: string;
  level: string;
  chpsActive: number;
  patientsToday: number;
  lastSync: string;
  stockStatus: 'Adequate' | 'Warning' | 'Critical';
  status: 'Online' | 'Syncing' | 'Offline';
  system: 'eCHIS' | 'KenyaEMR' | 'KHIS';
}

export const KISUMU_FACILITIES: FacilityLiveStatus[] = [
  {
    id: 'fac-01',
    name: 'Jaramogi Oginga Odinga Teaching & Referral Hospital (JOOTRH)',
    subCounty: 'Kisumu Central',
    level: 'Level 5 (Referral)',
    chpsActive: 124,
    patientsToday: 482,
    lastSync: 'Just now',
    stockStatus: 'Adequate',
    status: 'Online',
    system: 'KenyaEMR',
  },
  {
    id: 'fac-02',
    name: 'Kisumu County Hospital',
    subCounty: 'Kisumu Central',
    level: 'Level 4 (County)',
    chpsActive: 88,
    patientsToday: 310,
    lastSync: '1 min ago',
    stockStatus: 'Adequate',
    status: 'Online',
    system: 'KenyaEMR',
  },
  {
    id: 'fac-03',
    name: 'Chulaimbo Sub-County Hospital',
    subCounty: 'Kisumu West',
    level: 'Level 4',
    chpsActive: 62,
    patientsToday: 194,
    lastSync: 'Just now',
    stockStatus: 'Warning',
    status: 'Online',
    system: 'eCHIS',
  },
  {
    id: 'fac-04',
    name: 'Kombewa Sub-County Hospital',
    subCounty: 'Seme',
    level: 'Level 4',
    chpsActive: 74,
    patientsToday: 215,
    lastSync: '3 mins ago',
    stockStatus: 'Adequate',
    status: 'Online',
    system: 'KenyaEMR',
  },
  {
    id: 'fac-05',
    name: 'Ahero Sub-County Hospital',
    subCounty: 'Nyando',
    level: 'Level 4',
    chpsActive: 95,
    patientsToday: 268,
    lastSync: '2 mins ago',
    stockStatus: 'Critical',
    status: 'Syncing',
    system: 'eCHIS',
  },
  {
    id: 'fac-06',
    name: 'Pap Onditi Sub-County Hospital',
    subCounty: 'Nyakach',
    level: 'Level 4',
    chpsActive: 68,
    patientsToday: 184,
    lastSync: 'Just now',
    stockStatus: 'Warning',
    status: 'Online',
    system: 'eCHIS',
  },
  {
    id: 'fac-07',
    name: 'Muhoroni Sub-County Hospital',
    subCounty: 'Muhoroni',
    level: 'Level 4',
    chpsActive: 54,
    patientsToday: 162,
    lastSync: '4 mins ago',
    stockStatus: 'Adequate',
    status: 'Online',
    system: 'KenyaEMR',
  },
  {
    id: 'fac-08',
    name: 'Gita Sub-County Hospital',
    subCounty: 'Kisumu East',
    level: 'Level 4',
    chpsActive: 46,
    patientsToday: 140,
    lastSync: '1 min ago',
    stockStatus: 'Adequate',
    status: 'Online',
    system: 'KHIS',
  },
  {
    id: 'fac-09',
    name: 'Manyatta Health Centre',
    subCounty: 'Kisumu Central',
    level: 'Level 3',
    chpsActive: 82,
    patientsToday: 230,
    lastSync: '5 mins ago',
    stockStatus: 'Adequate',
    status: 'Online',
    system: 'eCHIS',
  },
  {
    id: 'fac-10',
    name: 'Maseno Mission Hospital',
    subCounty: 'Kisumu West',
    level: 'Level 4 (FBO)',
    chpsActive: 38,
    patientsToday: 125,
    lastSync: '6 mins ago',
    stockStatus: 'Adequate',
    status: 'Online',
    system: 'KenyaEMR',
  },
  {
    id: 'fac-11',
    name: 'Nyabondo Mission Hospital',
    subCounty: 'Nyakach',
    level: 'Level 4 (FBO)',
    chpsActive: 42,
    patientsToday: 138,
    lastSync: '2 mins ago',
    stockStatus: 'Warning',
    status: 'Online',
    system: 'KenyaEMR',
  },
  {
    id: 'fac-12',
    name: 'Ober Kamoth Dispensary',
    subCounty: 'Nyakach',
    level: 'Level 2',
    chpsActive: 19,
    patientsToday: 54,
    lastSync: 'Just now',
    stockStatus: 'Critical',
    status: 'Syncing',
    system: 'eCHIS',
  },
];

export const INITIAL_LIVE_EVENTS: LiveHealthEvent[] = [
  {
    id: 'evt-1',
    timestamp: 'Just now',
    secondsAgo: 5,
    subCounty: 'Nyakach',
    facility: 'Pap Onditi Sub-County Hospital',
    category: 'alert',
    message: 'Malaria test positivity rate increased to 43.8% across 18 community units.',
    severity: 'critical',
  },
  {
    id: 'evt-2',
    timestamp: '42s ago',
    secondsAgo: 42,
    subCounty: 'Nyando',
    facility: 'Ahero Sub-County Hospital',
    category: 'commodity',
    message: 'Automated KEMSA stock transfer: 5,200 Artemether-Lumefantrine units dispatched.',
    severity: 'warning',
  },
  {
    id: 'evt-3',
    timestamp: '2m ago',
    secondsAgo: 120,
    subCounty: 'Kisumu Central',
    facility: 'JOOTRH Referral',
    category: 'echis_sync',
    message: 'eCHIS gateway batch processed: 164 maternal & child health encounters logged.',
    severity: 'info',
  },
  {
    id: 'evt-4',
    timestamp: '4m ago',
    secondsAgo: 240,
    subCounty: 'Kisumu West',
    facility: 'Chulaimbo Hospital',
    category: 'surveillance',
    message: 'Acute watery diarrhoea cluster investigation verified by Sub-County Disease Surveillance Officer.',
    severity: 'warning',
  },
  {
    id: 'evt-5',
    timestamp: '7m ago',
    secondsAgo: 420,
    subCounty: 'Seme',
    facility: 'Kombewa Sub-County Hospital',
    category: 'audit',
    message: 'Kenya Data Protection Act audit completed: zero identifiable patient data leaked.',
    severity: 'normal',
  },
  {
    id: 'evt-6',
    timestamp: '11m ago',
    secondsAgo: 660,
    subCounty: 'Muhoroni',
    facility: 'Muhoroni Sub-County Hospital',
    category: 'commodity',
    message: 'Buffer stock of Oral Rehydration Salts (ORS) confirmed at 4.2 months of stock.',
    severity: 'normal',
  },
];

// Pool of simulated incoming real-time telemetry events
const SIMULATION_EVENT_POOL = [
  {
    subCounty: 'Kisumu Central',
    facility: 'Manyatta Health Centre',
    category: 'echis_sync' as const,
    message: 'Community Health Promoter synced 38 household nutrition and malaria assessments via eCHIS.',
    severity: 'info' as const,
  },
  {
    subCounty: 'Nyakach',
    facility: 'Ober Kamoth Dispensary',
    category: 'alert' as const,
    message: 'Syndromic signal triggered: 14 febrile illness cases flagged in South Nyakach ward.',
    severity: 'warning' as const,
  },
  {
    subCounty: 'Nyando',
    facility: 'Ahero Sub-County Hospital',
    category: 'commodity' as const,
    message: 'Emergency buffer stock received: 1,800 Amoxicillin DT dispersible tablets logged.',
    severity: 'normal' as const,
  },
  {
    subCounty: 'Kisumu East',
    facility: 'Gita Sub-County Hospital',
    category: 'surveillance' as const,
    message: 'IDSR Form 505 weekly aggregated surveillance file validated and uploaded to KHIS.',
    severity: 'info' as const,
  },
  {
    subCounty: 'Seme',
    facility: 'Kombewa Sub-County Hospital',
    category: 'echis_sync' as const,
    message: 'KenyaEMR-eCHIS cross-facility deduplication pipeline completed (0 conflict detected).',
    severity: 'normal' as const,
  },
  {
    subCounty: 'Muhoroni',
    facility: 'Muhoroni Hospital',
    category: 'alert' as const,
    message: 'Measles vaccination catch-up campaign scheduled for Chemelil Ward following signal review.',
    severity: 'info' as const,
  },
];

type EventListener = (event: LiveHealthEvent) => void;
const listeners: Set<EventListener> = new Set();

export function subscribeToLiveEvents(listener: EventListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

let eventCounter = 100;

export function emitSimulatedLiveEvent(): LiveHealthEvent {
  const template = SIMULATION_EVENT_POOL[Math.floor(Math.random() * SIMULATION_EVENT_POOL.length)];
  eventCounter++;
  const newEvent: LiveHealthEvent = {
    id: `evt-${eventCounter}`,
    timestamp: 'Just now',
    secondsAgo: 0,
    subCounty: template.subCounty,
    facility: template.facility,
    category: template.category,
    message: template.message,
    severity: template.severity,
  };

  listeners.forEach((listener) => {
    try {
      listener(newEvent);
    } catch (e) {
      console.error('Error delivering live event:', e);
    }
  });

  return newEvent;
}
