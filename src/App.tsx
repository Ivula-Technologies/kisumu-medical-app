import { useState } from 'react'
import './App.css'
import { overviewData } from './services/overviewData'
import { diseaseSignals as initialDiseaseSignals, type DiseaseSignal } from './services/diseaseSignalsData'
import { commodityForecasts, subCountyStock } from './services/commodityForecastData'
import { sourceQuality, facilityReporting, dataQualityIssues, facilitiesNotReporting } from './services/dataQualityData'
import { pilotIndicators, pilotMESummary, subCountyPilotPerformance } from './services/pilotMEData'
import { dataSources, rolePermissions, accessLog, governanceNotes } from './services/dataGovernanceData'
import { coverageGaps as initialCoverageGaps, coverageIndicators, subCountyCoverage, type CoverageGap, type GapStatus } from './services/serviceCoverageData'
import { getGroqModel } from './services/groqService'
import { downloadCsv, type CsvRow } from './utils/csv'
import { AiCopilotDrawer } from './components/AiCopilotDrawer'
import { AiSettingsModal } from './components/AiSettingsModal'
import { LandingPage } from './components/LandingPage'
import { RealTimeClock, SourceStatusList } from './components/RealtimeWidgets'
import { Icon, type IconName } from './components/ui'
import { OverviewPage } from './pages/OverviewPage'
import { DiseaseSignalsPage } from './pages/DiseaseSignalsPage'
import { CommodityForecastPage, type ApprovalStatus } from './pages/CommodityForecastPage'
import { ServiceCoveragePage } from './pages/ServiceCoveragePage'
import { DataQualityPage } from './pages/DataQualityPage'
import { PilotMEPage } from './pages/PilotMEPage'
import { GovernancePage } from './pages/GovernancePage'

const TABS = ['Overview', 'Disease Signals', 'Commodity Forecast', 'Service Coverage', 'Data Quality', 'Pilot M&E', 'Data & Governance'] as const
type Tab = (typeof TABS)[number]

const TAB_META: Record<Tab, { icon: IconName; eyebrow: string }> = {
  Overview: { icon: 'overview', eyebrow: 'County operations' },
  'Disease Signals': { icon: 'signals', eyebrow: 'IDSR signal detection' },
  'Commodity Forecast': { icon: 'commodity', eyebrow: 'Essential medicines supply' },
  'Service Coverage': { icon: 'coverage', eyebrow: 'Community and facility service gaps' },
  'Data Quality': { icon: 'quality', eyebrow: 'Reporting and validation' },
  'Pilot M&E': { icon: 'pilot', eyebrow: 'Monitoring and evaluation' },
  'Data & Governance': { icon: 'governance', eyebrow: 'Data protection and access' },
}

const NAV_GROUPS: Array<{ label: string; tabs: Tab[] }> = [
  { label: 'Surveillance', tabs: ['Overview', 'Disease Signals', 'Commodity Forecast', 'Service Coverage'] },
  { label: 'Assurance', tabs: ['Data Quality', 'Pilot M&E', 'Data & Governance'] },
]

const isTab = (value: string): value is Tab => (TABS as readonly string[]).includes(value)

const timestamp = () => new Date().toISOString().replace('T', ' ').slice(0, 16)

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

  const [lastSync, setLastSync] = useState(timestamp)
  const [isSyncing, setIsSyncing] = useState(false)

  const [isCopilotOpen, setIsCopilotOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [activeModel, setActiveModel] = useState(getGroqModel())

  const [signals, setSignals] = useState<DiseaseSignal[]>(() =>
    loadStored('kisumu_disease_signals', initialDiseaseSignals),
  )
  const [approvals, setApprovals] = useState<Record<string, ApprovalStatus>>(() =>
    loadStored('kisumu_commodity_approvals', {}),
  )

  const [gaps, setGaps] = useState<CoverageGap[]>(() => {
    // Only the review state is stored, so the seeded figures stay current.
    const saved = loadStored<Record<string, GapStatus>>('kisumu_coverage_gap_status', {})
    return initialCoverageGaps.map((g) => ({ ...g, status: saved[g.id] ?? g.status }))
  })

  const navCounts: Partial<Record<Tab, { count: number; label: string }>> = {
    'Disease Signals': {
      count: signals.filter((s) => s.status === 'Unverified' || s.status === 'Under investigation').length,
      label: 'signals awaiting verification',
    },
    'Service Coverage': {
      count: gaps.filter((g) => g.status === 'Unreviewed').length,
      label: 'coverage gaps awaiting review',
    },
  }

  const goTo = (tab: Tab) => {
    setActiveTab(tab)
    setIsNavOpen(false)
    window.scrollTo({ top: 0 })
  }

  const enterDashboard = (target?: string) => {
    if (target && isTab(target)) setActiveTab(target)
    setViewMode('dashboard')
    window.scrollTo({ top: 0 })
  }

  const syncNow = () => {
    setIsSyncing(true)
    setTimeout(() => {
      setLastSync(timestamp())
      setIsSyncing(false)
    }, 1200)
  }

  const updateSignal = (disease: string, change: (signal: DiseaseSignal) => DiseaseSignal) => {
    setSignals((prev) => {
      const updated = prev.map((s) => (s.disease === disease ? change(s) : s))
      store('kisumu_disease_signals', updated)
      return updated
    })
  }

  const changeSignalStatus = (disease: string, status: DiseaseSignal['status']) =>
    updateSignal(disease, (s) => ({
      ...s,
      status,
      auditTrail: [`${timestamp()} — Status updated to '${status}' by County Health Manager.`, ...s.auditTrail],
    }))

  const addSignalNote = (disease: string, note: string) =>
    updateSignal(disease, (s) => ({
      ...s,
      notes: note,
      auditTrail: [`${timestamp()} — Note: ${note} (Dr. Akinyi/County Health Manager)`, ...s.auditTrail],
    }))

  const changeApproval = (commodity: string, status: ApprovalStatus) => {
    setApprovals((prev) => {
      const updated = { ...prev, [commodity]: status }
      store('kisumu_commodity_approvals', updated)
      return updated
    })
  }

  const changeGapStatus = (id: string, status: GapStatus) => {
    setGaps((prev) => {
      const updated = prev.map((g) => (g.id === id ? { ...g, status } : g))
      store('kisumu_coverage_gap_status', Object.fromEntries(updated.map((g) => [g.id, g.status])))
      return updated
    })
  }

  const exportCurrent = () => {
    const exports: Record<Tab, { name: string; rows: CsvRow[] }> = {
      Overview: {
        name: 'kisumu-health-intelligence-overview',
        rows: [
          ['Section', 'Metric', 'Value'],
          ['Overview', 'Facilities reporting this week', `${overviewData.metrics.reportingThisWeek}/${overviewData.metrics.totalFacilities}`],
          ['Overview', 'Data completeness %', `${overviewData.metrics.completeness}%`],
          ['Overview', 'Reporting timeliness %', `${overviewData.metrics.timeliness}%`],
          ['Overview', 'Open alerts', overviewData.metrics.openAlerts],
          ['Overview', 'Facilities at stockout risk', overviewData.metrics.stockoutRisk],
          [],
          ['Sub-county', 'Facilities', 'Alert level', 'Risk index', 'Trend'],
          ...overviewData.subCounties.map((c) => [c.name, c.facilities, c.alertLevel, c.riskIndex, c.trend]),
          [],
          ['Alert ID', 'Title', 'Sub County', 'Disease', 'State', 'Officer', 'Count', 'Threshold'],
          ...overviewData.latestAlerts.map((a) => [a.id, a.title, a.subCounty, a.disease, a.state, a.officer, a.count, a.threshold]),
        ],
      },
      'Disease Signals': {
        name: 'kisumu-disease-signals',
        rows: [
          ['Disease', 'Sub-county', 'Week', 'Cases', 'Expected min', 'Expected max', 'Baseline mean', 'z-score', 'Priority', 'Status', 'Officer', 'Why flagged', 'Latest note'],
          ...signals.map((s) => [s.disease, s.subCounty, s.currentWeek, s.actual, s.expectedMin, s.expectedMax, s.baselineMean, s.zScore, s.level, s.status, s.assignedOfficer, s.whyFlagged, s.notes]),
        ],
      },
      'Commodity Forecast': {
        name: 'kisumu-commodity-forecast',
        rows: [
          ['Commodity', 'Unit', 'Stock on Hand', 'Monthly Consumption', '3-Month Forecast', 'Confidence Min', 'Confidence Max', 'Months of Stock', 'Risk Status', 'Facilities at Risk', 'Redistribution Suggestion', 'Approval'],
          ...commodityForecasts.map((f) => [f.commodity, f.unit, f.stockOnHand, f.monthlyConsumption, f.forecast3Month, f.confidenceBand.min, f.confidenceBand.max, f.monthsOfStock.toFixed(1), f.riskStatus, f.facilitiesAtRisk, f.redistributionSuggestion, approvals[f.commodity] ?? 'Pending']),
          [],
          ['Sub-county', 'Commodity', 'Stock on Hand', 'Months of Stock', 'Risk Status'],
          ...subCountyStock.map((s) => [s.subCounty, s.commodity, s.stockOnHand, s.monthsOfStock.toFixed(1), s.riskStatus]),
        ],
      },
      'Service Coverage': {
        name: 'kisumu-service-coverage',
        rows: [
          ['Sub-county', 'Households', 'Community Units', 'CHPs', ...coverageIndicators.map((i) => `${i.name} % (target ${i.target})`)],
          ...subCountyCoverage.map((sc) => [sc.subCounty, sc.households, sc.communityUnits, sc.chps, ...coverageIndicators.map((i) => sc.coverage[i.id])]),
          [],
          ['Gap ID', 'Sub-county', 'Area', 'Indicator', 'Coverage %', 'Target %', 'Community Units', 'Households', 'Why Flagged', 'Suggested Action', 'Status'],
          ...gaps.map((g) => [g.id, g.subCounty, g.area, coverageIndicators.find((i) => i.id === g.indicator)?.name ?? g.indicator, g.coverage, coverageIndicators.find((i) => i.id === g.indicator)?.target ?? '', g.communityUnits, g.households, g.whyFlagged, g.suggestedAction, g.status]),
        ],
      },
      'Data Quality': {
        name: 'kisumu-data-quality',
        rows: [
          ['Source', 'Facilities Connected', 'Facilities Reporting', 'Completeness %', 'Timeliness %', 'Last Sync', 'Validation Errors'],
          ...sourceQuality.map((s) => [s.source, s.facilitiesConnected, s.facilitiesReporting, s.completeness, s.timeliness, s.lastSync, s.validationErrors]),
          [],
          ['Facility', 'Sub-county', 'Source', 'Last Report', 'Completeness %', 'Timeliness %', 'Validation Status', 'Issues Count'],
          ...facilityReporting.map((f) => [f.facility, f.subCounty, f.source, f.lastReport, f.completeness, f.timeliness, f.validationStatus, f.issuesCount]),
          [],
          ['Facility', 'Sub-county', 'Source', 'Issue', 'Severity', 'Days Since Report'],
          ...dataQualityIssues.map((i) => [i.facility, i.subCounty, i.source, i.issue, i.severity, i.daysSinceReport]),
          [],
          ['Facility', 'Sub-county', 'Source', 'Days Since Last Report'],
          ...facilitiesNotReporting.map((f) => [f.facility, f.subCounty, f.source, f.daysSinceLastReport]),
        ],
      },
      'Pilot M&E': {
        name: 'kisumu-pilot-me',
        rows: [
          ['Indicator ID', 'Name', 'Current Value', 'Baseline Value', 'Target Value', 'Unit', 'Trend', 'Status'],
          ...pilotIndicators.map((i) => [i.id, i.name, i.currentValue, i.baselineValue, i.targetValue, i.unit, i.trend, i.status]),
          [],
          ['Sub-county', 'Timeliness %', 'Completeness %', 'Verification Time (h)', 'MAPE %', 'Active Users', 'Signal Action %', 'Stockout Prevention %', 'Coverage Gap Response %'],
          ...subCountyPilotPerformance.map((s) => [s.subCounty, s.timeliness, s.completeness, s.verificationTime, s.mape, s.activeUsers, s.signalActionRate, s.stockoutPrevention, s.coverageGapResponse]),
        ],
      },
      'Data & Governance': {
        name: 'kisumu-data-governance',
        rows: [
          ['Source', 'Type', 'Status', 'Facilities Covered', 'Records Synced (24h)', 'Last Sync', 'Sync Frequency'],
          ...dataSources.map((s) => [s.name, s.type, s.status, s.facilitiesCovered, s.recordsSynced, s.lastSync, s.syncFrequency]),
          [],
          ['Role', 'Description', 'User Count', 'Last Access', 'Permissions'],
          ...rolePermissions.map((r) => [r.role, r.description, r.userCount, r.lastAccess, r.permissions.join('; ')]),
          [],
          ['Timestamp', 'User', 'Role', 'Action', 'Resource', 'IP', 'Status'],
          ...accessLog.map((a) => [a.timestamp, a.user, a.role, a.action, a.resource, a.ip, a.status]),
          [],
          ['Category', 'Title', 'Description', 'Status', 'Reference'],
          ...governanceNotes.map((g) => [g.category, g.title, g.description, g.status, g.reference]),
        ],
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
        contextSummary={
          viewMode === 'landing'
            ? 'Kisumu Health Intelligence Public Portal & Operations. 261 health facilities across 7 sub-counties.'
            : `Kisumu Health Intelligence operations dashboard. Tab: ${activeTab}. Facilities: 261, Sub-counties: 7.`
        }
        onOpenSettings={() => {
          setIsCopilotOpen(false)
          setIsSettingsOpen(true)
        }}
      />
      <AiSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSaved={() => setActiveModel(getGroqModel())}
      />
    </>
  )

  if (viewMode === 'landing') {
    return (
      <>
        <LandingPage onEnterDashboard={enterDashboard} onOpenCopilot={() => setIsCopilotOpen(true)} />
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
            KH
          </span>
          <div>
            <p className="brand-name">Kisumu Health Intelligence</p>
            <p className="brand-sub">County Department of Health</p>
          </div>
        </div>

        <nav className="nav" aria-label="Main navigation">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="nav-group">
              <p className="nav-label">{group.label}</p>
              {group.tabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={tab === activeTab ? 'nav-item active' : 'nav-item'}
                  aria-current={tab === activeTab ? 'page' : undefined}
                  onClick={() => goTo(tab)}
                >
                  <Icon name={TAB_META[tab].icon} />
                  <span>{tab}</span>
                  {navCounts[tab]?.count ? (
                    <span className="nav-count" title={`${navCounts[tab].count} ${navCounts[tab].label}`}>
                      {navCounts[tab].count}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-foot">
          <div className="sidebar-block">
            <p className="nav-label">Data sources</p>
            <SourceStatusList />
          </div>

          <div className="account">
            <span className="avatar" aria-hidden="true">
              CM
            </span>
            <div>
              <p className="account-role">County Health Manager</p>
              <p className="account-scope">All 7 sub-counties · 261 facilities</p>
            </div>
          </div>

          <button type="button" className="sidebar-link" onClick={() => setViewMode('landing')}>
            <Icon name="home" size={16} />
            Public portal
          </button>
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <button
            type="button"
            className="icon-btn nav-toggle"
            onClick={() => setIsNavOpen((v) => !v)}
            aria-label="Toggle navigation"
            aria-expanded={isNavOpen}
          >
            <Icon name={isNavOpen ? 'close' : 'menu'} />
          </button>

          <div className="topbar-title">
            <p className="eyebrow">{meta.eyebrow} · Epi week 42</p>
            <h1>{activeTab}</h1>
          </div>

          <div className="topbar-actions">
            <div className="sync-meta" aria-live="polite">
              <span className="sync-line">
                <span className={isSyncing ? 'dot dot-info pulse' : 'dot dot-ok'} aria-hidden="true" />
                {isSyncing ? 'Syncing sources…' : `Synced ${lastSync}`}
              </span>
              <RealTimeClock />
            </div>
            <button type="button" className="btn" onClick={syncNow} disabled={isSyncing} title="Sync eCHIS, KenyaEMR and KHIS">
              <Icon name="sync" size={16} />
              <span className="btn-label">Sync</span>
            </button>
            <button type="button" className="btn" onClick={exportCurrent} title={`Export ${activeTab} as CSV`}>
              <Icon name="download" size={16} />
              <span className="btn-label">Export CSV</span>
            </button>
            <button type="button" className="btn btn-primary" onClick={() => setIsCopilotOpen(true)}>
              <Icon name="assistant" size={16} />
              <span className="btn-label">Ask copilot</span>
            </button>
            <button
              type="button"
              className="icon-btn"
              onClick={() => setIsSettingsOpen(true)}
              title={`AI settings — model ${modelLabel}`}
              aria-label="AI settings"
            >
              <Icon name="settings" />
            </button>
          </div>
        </header>

        <main className="page">
          {activeTab === 'Overview' ? (
            <OverviewPage onOpenSignals={() => goTo('Disease Signals')} />
          ) : activeTab === 'Disease Signals' ? (
            <DiseaseSignalsPage
              signals={signals}
              onStatusChange={changeSignalStatus}
              onAddNote={addSignalNote}
              onAskCopilot={() => setIsCopilotOpen(true)}
            />
          ) : activeTab === 'Commodity Forecast' ? (
            <CommodityForecastPage
              approvals={approvals}
              onApprovalChange={changeApproval}
              onAskCopilot={() => setIsCopilotOpen(true)}
              lastSync={lastSync}
            />
          ) : activeTab === 'Service Coverage' ? (
            <ServiceCoveragePage gaps={gaps} onStatusChange={changeGapStatus} onAskCopilot={() => setIsCopilotOpen(true)} />
          ) : activeTab === 'Data Quality' ? (
            <DataQualityPage lastSync={lastSync} />
          ) : activeTab === 'Pilot M&E' ? (
            <PilotMEPage />
          ) : (
            <GovernancePage lastSync={lastSync} />
          )}

          <p className="page-foot">
            Synthetic demo data. Aggregated figures only, with no patient-level identifiers. {pilotMESummary.reportingPeriod}.
          </p>
        </main>
      </div>

      {overlays}
    </div>
  )
}

export default App
