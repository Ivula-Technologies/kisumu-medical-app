import { useEffect, useState } from 'react'
import './App.css'
import { facilities, facilityById, initialEscalations, initialReferrals, type Escalation, type EscalationStatus } from './services/referralData'
import { dueAt, linkageMetrics, missingFields, sla, type Referral } from './services/referralProtocol'
import { actorLabel, allowedActions, applyAction, type ReferralAction } from './services/referralActions'
import { ROLES, notificationsFor, visibleReferrals, type RoleId } from './services/roles'
import { accessLog, controls, roleAccess } from './services/governanceData'
import { followUpTaskCount } from './services/followUp'
import { getGroqModel } from './services/groqService'
import { downloadCsv, type CsvRow } from './utils/csv'
import { formatDateTime } from './utils/time'
import { AiCopilotDrawer } from './components/AiCopilotDrawer'
import { AiSettingsModal } from './components/AiSettingsModal'
import { LandingPage } from './components/LandingPage'
import { RealTimeClock, SourceStatusList } from './components/RealtimeWidgets'
import { Dot, Icon, type IconName } from './components/ui'
import { OverviewPage } from './pages/OverviewPage'
import { EscalationsPage } from './pages/EscalationsPage'
import { NewReferralPage } from './pages/NewReferralPage'
import { ReferralsPage } from './pages/ReferralsPage'
import { FollowUpPage } from './pages/FollowUpPage'
import { DirectoryPage } from './pages/DirectoryPage'
import { PilotMEPage } from './pages/PilotMEPage'
import { GovernancePage } from './pages/GovernancePage'

const TABS = ['Overview', 'Escalations', 'New referral', 'Referrals', 'Follow-up', 'Directory', 'Pilot M&E', 'Data & Governance'] as const
type Tab = (typeof TABS)[number]

const TAB_META: Record<Tab, { icon: IconName; group: string; lede: string }> = {
  Overview: { icon: 'overview', group: 'Referral and linkage', lede: 'How people are moving from community screening to care, and where they are getting lost.' },
  Escalations: { icon: 'flag', group: 'Referral and linkage', lede: 'Suicide risk, psychosis and risk of harm go to a clinician by phone at once. They never enter the referral queue.' },
  'New referral': { icon: 'plus', group: 'Referral and linkage', lede: 'Screen with approved tools. The rules set the urgency and suggest where to refer; you decide and send.' },
  Referrals: { icon: 'route', group: 'Referral and linkage', lede: 'Every referral from sending to feedback, with who acts next and how long is left.' },
  'Follow-up': { icon: 'list', group: 'Referral and linkage', lede: 'Missed appointments to trace, reminders to send and outcomes owed to referrers, so nobody is lost between steps.' },
  Directory: { icon: 'coverage', group: 'Network', lede: 'Facilities that receive mental health referrals: what they offer, how full they are and how far they are from each settlement.' },
  'Pilot M&E': { icon: 'pilot', group: 'Assurance', lede: 'Pilot indicators from the concept note. Most are calculated live from the referral records.' },
  'Data & Governance': { icon: 'governance', group: 'Assurance', lede: "Who can see what, and the safeguards for sensitive mental health data under Kenya's Data Protection Act and Digital Health Act." },
}

const NAV_GROUPS: Array<{ label: string; tabs: Tab[] }> = [
  { label: 'Referral and linkage', tabs: ['Overview', 'Escalations', 'New referral', 'Referrals', 'Follow-up'] },
  { label: 'Network', tabs: ['Directory'] },
  { label: 'Assurance', tabs: ['Pilot M&E', 'Data & Governance'] },
]

const isTab = (value: string): value is Tab => (TABS as readonly string[]).includes(value)
const KEYS = { referrals: 'kisumu_mh_referrals_v1', escalations: 'kisumu_mh_escalations_v1', role: 'kisumu_mh_role' }

function loadStored<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key)
    return saved ? (JSON.parse(saved) as T) : fallback
  } catch {
    return fallback
  }
}

function store(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage is a convenience; the session still works without it.
  }
}

function App() {
  const [viewMode, setViewMode] = useState<'landing' | 'dashboard'>(() =>
    new URLSearchParams(window.location.search).get('view') === 'landing' ? 'landing' : 'dashboard',
  )
  const [activeTab, setActiveTab] = useState<Tab>('Overview')
  const [isNavOpen, setIsNavOpen] = useState(false)
  const [isBellOpen, setIsBellOpen] = useState(false)
  const [roleId, setRoleId] = useState<RoleId>(() => loadStored<RoleId>(KEYS.role, 'county'))
  const [referrals, setReferrals] = useState<Referral[]>(() => loadStored(KEYS.referrals, initialReferrals))
  const [escalations, setEscalations] = useState<Escalation[]>(() => loadStored(KEYS.escalations, initialEscalations))
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [toast, setToast] = useState('')
  const [now, setNow] = useState(() => new Date())

  const [isCopilotOpen, setIsCopilotOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [activeModel, setActiveModel] = useState(getGroqModel())

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(tick)
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 5000)
    return () => clearTimeout(t)
  }, [toast])

  const role = ROLES[roleId]
  const visible = visibleReferrals(role, referrals)
  const notices = notificationsFor(role, referrals, escalations, now)
  const activeEscalations = escalations.filter((e) => e.status === 'Awaiting clinician' || e.status === 'Clinician on the line')

  const navCounts: Partial<Record<Tab, { count: number; label: string; tone: 'critical' | 'high' }>> = {
    Escalations: { count: activeEscalations.length, label: 'active emergency escalations', tone: 'critical' },
    Referrals: { count: visible.filter((r) => allowedActions(role, r).length > 0).length, label: 'referrals needing your action', tone: 'high' },
    'Follow-up': {
      count: followUpTaskCount(visible, now),
      label: 'follow-up tasks',
      tone: 'high',
    },
  }

  const goTo = (tab: Tab) => {
    setActiveTab(tab)
    setIsNavOpen(false)
    setIsBellOpen(false)
    window.scrollTo({ top: 0 })
  }

  const openReferral = (id: string) => {
    setSelectedId(id)
    goTo('Referrals')
  }

  const switchRole = (id: RoleId) => {
    setRoleId(id)
    store(KEYS.role, id)
    setSelectedId(null)
    setIsBellOpen(false)
  }

  const saveReferrals = (next: Referral[]) => {
    setReferrals(next)
    store(KEYS.referrals, next)
  }

  const act = (id: string, action: ReferralAction) => {
    const current = referrals.find((r) => r.id === id)
    if (!current) return
    let updated: Referral
    try {
      updated = applyAction(current, action, role, new Date())
    } catch (err: unknown) {
      setToast(err instanceof Error ? err.message : String(err))
      return
    }
    saveReferrals(referrals.map((r) => (r.id === id ? updated : r)))
    const who = current.referredBy.id
    const facility = facilityById[updated.toFacilityId]?.short ?? 'the facility'
    const messages: Record<ReferralAction['type'], string> = {
      accept: `${id} accepted. ${who} has been notified.`,
      decline: `${id} declined. ${who} and the county coordinator have been notified.`,
      schedule: `Appointment saved for ${id}. ${who} has been notified.`,
      remind: `Reminder recorded for ${id}.`,
      attended: `${id} marked attended. Feedback to ${who} is now due.`,
      missed: `${id} marked missed. ${who} has been alerted to trace.`,
      feedback: `Feedback sent to ${who}. ${id} is closed.`,
      trace: `Tracing outcome recorded. ${facility} has been asked to rebook.`,
      redirect: `${id} redirected to ${facility}, which has been notified.`,
      chase: `Follow-up with ${facility} recorded for ${id}.`,
    }
    setToast(messages[action.type])
  }

  const createReferral = (r: Referral) => {
    saveReferrals([r, ...referrals])
    setToast(`${r.id} sent to ${facilityById[r.toFacilityId]?.name}, which has been notified.`)
    openReferral(r.id)
  }

  const saveEscalations = (next: Escalation[]) => {
    setEscalations(next)
    store(KEYS.escalations, next)
  }

  const escalate = (e: Escalation) => {
    saveEscalations([e, ...escalations])
    setToast(`Emergency ${e.id} recorded. Stay with the person while you call.`)
    goTo('Escalations')
  }

  const advanceEscalation = (id: string, to: EscalationStatus, text: string) => {
    const at = new Date().toISOString()
    saveEscalations(
      escalations.map((e) =>
        e.id === id
          ? {
              ...e,
              status: to,
              respondedAt: e.respondedAt ?? (to === 'Clinician on the line' ? at : undefined),
              responder: e.responder ?? (to === 'Clinician on the line' ? `${e.destination} on-call clinician` : undefined),
              log: [...e.log, { at, text }],
            }
          : e,
      ),
    )
  }

  const resetDemo = () => {
    try {
      localStorage.removeItem(KEYS.referrals)
      localStorage.removeItem(KEYS.escalations)
    } catch {
      // ignore
    }
    setReferrals(initialReferrals)
    setEscalations(initialEscalations)
    setSelectedId(null)
    setToast('Demo data reset.')
  }

  const ids = referrals.map((r) => Number(r.id.replace(/\D/g, '')))
  const clientIds = [...referrals.map((r) => r.client), ...escalations.map((e) => e.client)].map((c) => Number(c.replace(/\D/g, '')))
  const nextReferralId = `REF-${Math.max(...ids) + 1}`
  const nextClientId = `MH-${String(Math.max(...clientIds) + 1).padStart(4, '0')}`
  const nextEscalationId = `ESC-${Math.max(...escalations.map((e) => Number(e.id.replace(/\D/g, '')))) + 1}`

  const exportCurrent = () => {
    const referralRows: CsvRow[] = [
      ['Referral', 'Client', 'Sex', 'Age band', 'Settlement', 'Community unit', 'Referred by', 'To facility', 'Service', 'Urgency', 'Status', 'Created', 'Due', 'Timeframe', 'Appointment', 'PHQ-9', 'PHQ-9 item 9', 'GAD-7', 'AUDIT-C', 'Consent', 'Missing fields'],
      ...visible.map((r) => [
        r.id, r.client, r.sex, r.ageBand, r.settlement, r.communityUnit, r.referredBy.id, facilityById[r.toFacilityId]?.name ?? r.toFacilityId, r.service, r.urgency, r.status,
        formatDateTime(r.createdAt), formatDateTime(dueAt(r).toISOString()), sla(r, now).label, r.appointmentAt ? formatDateTime(r.appointmentAt) : '',
        r.screening.phq9 ?? '', r.screening.phq9Item9 ?? '', r.screening.gad7 ?? '', r.screening.auditC ?? '', r.consentRecorded ? 'Yes' : 'No', missingFields(r).join('; '),
      ]),
    ]
    const m = linkageMetrics(visible, now)
    const exports: Record<Tab, { name: string; rows: CsvRow[] }> = {
      Overview: {
        name: 'kisumu-mh-linkage-overview',
        rows: [['Measure', 'Value'], ['Referrals', m.total], ['Open', m.open], ['Awaiting acceptance', m.awaitingAcceptance], ['Overdue', m.overdue], ['Missed', m.missed], ['Declined', m.declined], ['Seen within timeframe %', m.withinTimeframe?.toFixed(1) ?? ''], ['Feedback to referrer %', m.feedbackClosed?.toFixed(1) ?? ''], ['Median hours to attendance', m.medianHoursToAttendance?.toFixed(0) ?? ''], [], ['Stage', 'Count'], ...m.funnel.map((f) => [f.stage, f.count])],
      },
      Escalations: {
        name: 'kisumu-mh-escalations',
        rows: [['Escalation', 'Client', 'Settlement', 'Trigger', 'Raised by', 'Raised', 'Responded', 'Destination', 'Status'], ...escalations.map((e) => [e.id, e.client, e.settlement, e.trigger, e.raisedBy, formatDateTime(e.raisedAt), e.respondedAt ? formatDateTime(e.respondedAt) : '', e.destination, e.status])],
      },
      'New referral': { name: 'kisumu-mh-referrals', rows: referralRows },
      Referrals: { name: 'kisumu-mh-referrals', rows: referralRows },
      'Follow-up': { name: 'kisumu-mh-referrals', rows: referralRows },
      Directory: {
        name: 'kisumu-mh-referral-directory',
        rows: [['Facility', 'Level', 'Services', 'Open slots this week', 'Median wait (days)', 'Active in pilot'], ...facilities.map((f) => [f.name, f.level, f.services.join('; '), f.slotsThisWeek, f.medianWaitDays, f.activeInPilot ? 'Yes' : 'No'])],
      },
      'Pilot M&E': { name: 'kisumu-mh-referrals', rows: referralRows },
      'Data & Governance': {
        name: 'kisumu-mh-governance',
        rows: [['Control', 'Area', 'Status', 'Reference', 'Detail'], ...controls.map((c) => [c.control, c.area, c.status, c.reference, c.detail]), [], ['Role', 'Sees', 'Cannot'], ...roleAccess.map((r) => [r.role, r.sees, r.cannot]), [], ['Time', 'User', 'Action', 'Record'], ...accessLog.map((a) => [formatDateTime(a.at), a.user, a.action, a.record])],
      },
    }
    const { name, rows } = exports[activeTab]
    downloadCsv(name, rows)
  }

  const overlays = (
    <>
      <AiCopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        activeTab={activeTab}
        contextSummary={`Mental health referral and linkage pilot, Kisumu informal settlements. Viewing as ${role.label}. Tab: ${activeTab}. Aggregated pathway: ${linkageMetrics(visible, now).funnel.map((f) => `${f.stage} ${f.count}`).join(', ')}.`}
        onOpenSettings={() => {
          setIsCopilotOpen(false)
          setIsSettingsOpen(true)
        }}
      />
      <AiSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} onSaved={() => setActiveModel(getGroqModel())} />
      {toast ? (
        <div className="toast" role="status">
          <Icon name="check" size={16} />
          <span>{toast}</span>
        </div>
      ) : null}
    </>
  )

  if (viewMode === 'landing') {
    return (
      <>
        <LandingPage
          referrals={referrals}
          now={now}
          onEnterDashboard={(target?: string) => {
            if (target && isTab(target)) setActiveTab(target)
            setViewMode('dashboard')
            window.scrollTo({ top: 0 })
          }}
          onOpenCopilot={() => setIsCopilotOpen(true)}
        />
        {overlays}
      </>
    )
  }

  const meta = TAB_META[activeTab]
  const modelLabel = activeModel.split('/')[1] || activeModel

  return (
    <div className="shell">
      <div className={isNavOpen ? 'scrim open' : 'scrim'} onClick={() => setIsNavOpen(false)} />

      <aside className={isNavOpen ? 'sidebar open' : 'sidebar'}>
        <div className="brand">
          <span className="crest" aria-hidden="true">
            KM
          </span>
          <div>
            <p className="brand-name">Kisumu Mental Health Linkage</p>
            <p className="brand-sub">County Department of Health · ACDO</p>
            <p className="brand-powered">
              Powered by <strong>Ivula Technologies</strong>
            </p>
          </div>
        </div>

        <nav className="nav" aria-label="Main navigation">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="nav-group">
              <p className="nav-label">{group.label}</p>
              {group.tabs.map((tab) => {
                const c = navCounts[tab]
                return (
                  <button
                    key={tab}
                    type="button"
                    className={tab === activeTab ? 'nav-item active' : 'nav-item'}
                    aria-current={tab === activeTab ? 'page' : undefined}
                    onClick={() => goTo(tab)}
                  >
                    <Icon name={TAB_META[tab].icon} />
                    <span>{tab}</span>
                    {c?.count ? (
                      <span className={`nav-count ${c.tone}`} title={`${c.count} ${c.label}`}>
                        {c.count}
                      </span>
                    ) : null}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-foot">
          <div className="sidebar-block">
            <p className="nav-label">Connected systems</p>
            <SourceStatusList />
          </div>
          <div className="account">
            <span className="avatar" aria-hidden="true">
              {role.initials}
            </span>
            <div>
              <p className="account-role">{role.short}</p>
              <p className="account-scope">{role.scope}</p>
            </div>
          </div>
          <button type="button" className="sidebar-link" onClick={resetDemo}>
            <Icon name="sync" size={16} />
            Reset demo data
          </button>
          <button type="button" className="sidebar-link" onClick={() => setViewMode('landing')}>
            <Icon name="home" size={16} />
            Public page
          </button>
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <button type="button" className="icon-btn nav-toggle" onClick={() => setIsNavOpen((v) => !v)} aria-label="Toggle navigation" aria-expanded={isNavOpen}>
            <Icon name={isNavOpen ? 'close' : 'menu'} />
          </button>

          <p className="crumbs">
            <span>{meta.group}</span>
            <span aria-hidden="true">/</span>
            <strong>{activeTab}</strong>
          </p>

          <div className="topbar-actions">
            <label className="role-switch" title="Demo: switch between the people in a referral">
              <Icon name="user" size={16} />
              <span className="sr-only">Viewing as</span>
              <select id="role-switch" value={roleId} onChange={(e) => switchRole(e.target.value as RoleId)}>
                {Object.values(ROLES).map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.short}
                  </option>
                ))}
              </select>
            </label>

            <div className="bell-wrap">
              <button
                type="button"
                className="icon-btn bell"
                onClick={() => setIsBellOpen((v) => !v)}
                aria-label={`${notices.length} notifications`}
                aria-expanded={isBellOpen}
              >
                <Icon name="bell" />
                {notices.length ? <span className={`bell-count ${notices[0].tone === 'critical' ? 'critical' : ''}`}>{notices.length}</span> : null}
              </button>
              {isBellOpen ? (
                <>
                  <div className="popover-scrim" onClick={() => setIsBellOpen(false)} />
                  <div className="popover" role="dialog" aria-label="Notifications">
                    <p className="popover-head">
                      Notifications for {role.short}
                      <span className="muted">{notices.length}</span>
                    </p>
                    {notices.length ? (
                      <ul className="popover-list">
                        {notices.map((n) => (
                          <li key={n.id}>
                            <button
                              type="button"
                              onClick={() => (n.referralId ? openReferral(n.referralId) : goTo('Escalations'))}
                            >
                              <Dot tone={n.tone} />
                              <span>
                                <strong>{n.title}</strong>
                                <span className="muted">{n.detail}</span>
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="empty-state">You are up to date.</p>
                    )}
                  </div>
                </>
              ) : null}
            </div>

            <button type="button" className="btn" onClick={exportCurrent} title={`Export ${activeTab} as CSV`}>
              <Icon name="download" size={16} />
              <span className="btn-label">Export</span>
            </button>
            <button type="button" className="btn btn-primary" onClick={() => setIsCopilotOpen(true)}>
              <Icon name="assistant" size={16} />
              <span className="btn-label">Ask copilot</span>
            </button>
            <button type="button" className="icon-btn" onClick={() => setIsSettingsOpen(true)} title={`AI settings — model ${modelLabel}`} aria-label="AI settings">
              <Icon name="settings" />
            </button>
          </div>
        </header>

        <main className="page" key={activeTab}>
          <header className="page-head">
            <div>
              <h1>{activeTab}</h1>
              <p className="page-lede">{meta.lede}</p>
            </div>
            <div className="page-tags">
              <span className="tag">Viewing as {role.short}</span>
              <RealTimeClock />
            </div>
          </header>

          {activeTab === 'Overview' ? (
            <OverviewPage role={role} referrals={visible} escalations={escalations} now={now} onOpenEscalations={() => goTo('Escalations')} />
          ) : activeTab === 'Escalations' ? (
            <EscalationsPage escalations={escalations} now={now} actor={actorLabel(role)} onAdvance={advanceEscalation} />
          ) : activeTab === 'New referral' ? (
            <NewReferralPage
              role={role}
              now={now}
              nextReferralId={nextReferralId}
              nextClientId={nextClientId}
              nextEscalationId={nextEscalationId}
              onSwitchRole={switchRole}
              onCreate={createReferral}
              onEscalate={escalate}
            />
          ) : activeTab === 'Referrals' ? (
            <ReferralsPage role={role} referrals={visible} now={now} selectedId={selectedId} onSelect={setSelectedId} onAction={act} />
          ) : activeTab === 'Follow-up' ? (
            <FollowUpPage role={role} referrals={visible} now={now} onOpen={openReferral} />
          ) : activeTab === 'Directory' ? (
            <DirectoryPage referrals={referrals} />
          ) : activeTab === 'Pilot M&E' ? (
            <PilotMEPage referrals={referrals} now={now} />
          ) : (
            <GovernancePage />
          )}

          <p className="page-foot">Powered by Ivula Technologies. Synthetic demo data: every person is fictional and identified only by a pseudonymous ID. Facility details are illustrative.</p>
        </main>
      </div>

      {overlays}
    </div>
  )
}

export default App
