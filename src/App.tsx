import { useMemo, useState } from 'react'
import './App.css'
import { overviewData } from './services/overviewData'
import { diseaseSignals as initialDiseaseSignals, diseaseTrendSummary, type DiseaseSignal } from './services/diseaseSignalsData'
import { commodityForecasts, subCountyStock, commoditySummary } from './services/commodityForecastData'
import { sourceQuality, facilityReporting, dataQualityIssues, facilitiesNotReporting, dataQualitySummary } from './services/dataQualityData'
import { pilotIndicators, pilotTrendData, pilotMESummary, subCountyPilotPerformance } from './services/pilotMEData'
import { dataSources, rolePermissions, accessLog, governanceNotes, dataGovernanceSummary } from './services/dataGovernanceData'
import { AiCopilotDrawer } from './components/AiCopilotDrawer'
import { AiSettingsModal } from './components/AiSettingsModal'
import { LandingPage } from './components/LandingPage'
import { RealTimeClock, AnimatedCounter, SystemStatusBar, LiveSyncIndicator, MetricProgressBar } from './components/RealtimeWidgets'
import {
  generateLiveDiseaseAnalysis,
  generateSupplyOptimization,
  getGroqModel,
} from './services/groqService'

const navItems = [
  'Overview',
  'Disease Signals',
  'Commodity Forecast',
  'Data Quality',
  'Pilot M&E',
  'Data & Governance',
] as const

const navIcons: Record<string, string> = {
  'Overview': '📊',
  'Disease Signals': '🦠',
  'Commodity Forecast': '💊',
  'Data Quality': '✅',
  'Pilot M&E': '📈',
  'Data & Governance': '🛡️',
}

const alertTone = {
  critical: 'critical',
  high: 'high',
  moderate: 'moderate',
  low: 'low',
} as const

function SignalChart({ values, expectedMin, expectedMax }: { values: number[]; expectedMin: number; expectedMax: number }) {
  const width = 620
  const height = 180
  const minValue = Math.min(...values, expectedMin)
  const maxValue = Math.max(...values, expectedMax)
  const range = maxValue - minValue || 1

  const linePath = values
    .map((value, index) => {
      const x = 26 + (index * (width - 52)) / (values.length - 1)
      const y = height - 26 - ((value - minValue) / range) * (height - 52)
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
    })
    .join(' ')

  const bandTop = expectedMax
  const bandBottom = expectedMin
  const bandPath = values
    .map((_, index) => {
      const x = 26 + (index * (width - 52)) / (values.length - 1)
      const yTop = height - 26 - ((bandTop - minValue) / range) * (height - 52)
      const yBottom = height - 26 - ((bandBottom - minValue) / range) * (height - 52)
      return `${index === 0 ? 'M' : 'L'} ${x} ${yTop} L ${x} ${yBottom}`
    })
    .join(' ')

  const circles = values.map((value, index) => {
    const x = 26 + (index * (width - 52)) / (values.length - 1)
    const y = height - 26 - ((value - minValue) / range) * (height - 52)
    return { x, y, value }
  })

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="signal-chart" role="img" aria-label="Disease trend chart">
      <defs>
        <linearGradient id="bandFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#a9e0dd" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#a9e0dd" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      <path d={bandPath} fill="url(#bandFill)" stroke="none" />
      <path d={linePath} fill="none" stroke="#0d6f7a" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      {circles.map((point) => (
        <g key={`${point.x}-${point.y}`}>
          <circle cx={point.x} cy={point.y} r="5" fill="#0d6f7a" />
          <circle cx={point.x} cy={point.y} r="10" fill="rgba(13, 111, 122, 0.08)" />
        </g>
      ))}
    </svg>
  )
}

function App() {
  // Top-level View Mode: 'dashboard' for Operations Intelligence (default as before), 'landing' for Public Portal
  const [viewMode, setViewMode] = useState<'landing' | 'dashboard'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('view') === 'landing') return 'landing'
      if (params.get('view') === 'dashboard') return 'dashboard'
    }
    return 'dashboard'
  })
  const [activeTab, setActiveTab] = useState<(typeof navItems)[number]>('Overview')
  const [showAllAlerts, setShowAllAlerts] = useState(false)
  const [selectedDisease, setSelectedDisease] = useState('Malaria')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Real-time synchronization state
  const [liveSyncTime, setLiveSyncTime] = useState<string>(() => {
    const now = new Date()
    return now.toISOString().replace('T', ' ').slice(0, 16)
  })
  const [isSyncingLive, setIsSyncingLive] = useState(false)

  // Groq Cloud AI Copilot and Settings States
  const [isCopilotOpen, setIsCopilotOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [activeModel, setActiveModel] = useState(getGroqModel())

  // Stateful Disease Signals with localStorage persistence
  const [signals, setSignals] = useState<DiseaseSignal[]>(() => {
    const saved = localStorage.getItem('kisumu_disease_signals')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        // fallback
      }
    }
    return initialDiseaseSignals
  })

  // Live Groq Disease Analysis state
  const [aiDiseaseAssessments, setAiDiseaseAssessments] = useState<Record<string, string>>({})
  const [isAnalyzingDisease, setIsAnalyzingDisease] = useState(false)
  const [newAuditNote, setNewAuditNote] = useState('')

  // Live Groq Supply Plan state
  const [aiSupplyPlan, setAiSupplyPlan] = useState<string>('')
  const [isAnalyzingSupply, setIsAnalyzingSupply] = useState(false)

  // Commodity Approvals state
  const [commodityApprovals, setCommodityApprovals] = useState<Record<string, 'Pending' | 'Approved' | 'Escalated'>>(() => {
    const saved = localStorage.getItem('kisumu_commodity_approvals')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        // fallback
      }
    }
    return {
      AL: 'Pending',
      'Amoxicillin DT': 'Pending',
      ORS: 'Pending',
      Zinc: 'Pending',
      'Malaria RDT': 'Pending',
    }
  })

  // Trigger simulated live sync across eCHIS, KenyaEMR and KHIS
  const triggerLiveSync = () => {
    setIsSyncingLive(true)
    setTimeout(() => {
      const now = new Date()
      const formatted = now.toISOString().replace('T', ' ').slice(0, 16)
      setLiveSyncTime(formatted)
      setIsSyncingLive(false)
    }, 1200)
  }

  const handleEnterDashboard = (targetTab?: string) => {
    if (targetTab && navItems.includes(targetTab as any)) {
      setActiveTab(targetTab as any)
    }
    setViewMode('dashboard')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleUpdateSignalStatus = (disease: string, newStatus: DiseaseSignal['status']) => {
    setSignals((prev) => {
      const updated = prev.map((s) => {
        if (s.disease === disease) {
          const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 16)
          const auditItem = `${timestamp} — Status updated to '${newStatus}' by County Health Manager.`
          return {
            ...s,
            status: newStatus,
            auditTrail: [auditItem, ...s.auditTrail],
          }
        }
        return s
      })
      localStorage.setItem('kisumu_disease_signals', JSON.stringify(updated))
      return updated
    })
  }

  const handleAddAuditNote = (disease: string) => {
    if (!newAuditNote.trim()) return
    setSignals((prev) => {
      const updated = prev.map((s) => {
        if (s.disease === disease) {
          const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 16)
          const auditItem = `${timestamp} — Note: ${newAuditNote.trim()} (Dr. Akinyi/County Health Manager)`
          return {
            ...s,
            notes: newAuditNote.trim(),
            auditTrail: [auditItem, ...s.auditTrail],
          }
        }
        return s
      })
      localStorage.setItem('kisumu_disease_signals', JSON.stringify(updated))
      return updated
    })
    setNewAuditNote('')
  }

  const handleApprovalChange = (commodity: string, status: 'Pending' | 'Approved' | 'Escalated') => {
    setCommodityApprovals((prev) => {
      const updated = { ...prev, [commodity]: status }
      localStorage.setItem('kisumu_commodity_approvals', JSON.stringify(updated))
      return updated
    })
  }

  const metrics = useMemo(
    () => [
      {
        label: 'Facilities reporting this week',
        value: overviewData.metrics.reportingThisWeek,
        suffix: `/${overviewData.metrics.totalFacilities}`,
        meta: '92.7% of facilities',
        trend: '+4.2% vs previous week',
        progress: (overviewData.metrics.reportingThisWeek / overviewData.metrics.totalFacilities) * 100,
        color: 'teal' as const,
      },
      {
        label: 'Data completeness %',
        value: overviewData.metrics.completeness,
        suffix: '%',
        decimals: 1,
        meta: 'Quality threshold met',
        trend: '+1.1 points',
        progress: overviewData.metrics.completeness,
        color: 'green' as const,
      },
      {
        label: 'Reporting timeliness %',
        value: overviewData.metrics.timeliness,
        suffix: '%',
        decimals: 1,
        meta: '11 counties tracked',
        trend: 'Within expected window',
        progress: overviewData.metrics.timeliness,
        color: 'teal' as const,
      },
      {
        label: 'Open alerts',
        value: overviewData.metrics.openAlerts,
        suffix: '',
        meta: '12 active investigations',
        trend: '5 require escalation',
        progress: (overviewData.metrics.openAlerts / 20) * 100,
        color: 'amber' as const,
      },
      {
        label: 'Facilities at stockout risk',
        value: overviewData.metrics.stockoutRisk,
        suffix: '',
        meta: 'Risk threshold reviewed',
        trend: '3 facilities flagged red',
        progress: (overviewData.metrics.stockoutRisk / 10) * 100,
        color: 'red' as const,
      },
    ],
    [],
  )

  const exportCsv = () => {
    const rows: Array<Array<string | number>> = [
      ['Section', 'Metric', 'Value'],
      ['Overview', 'Facilities reporting this week', `${overviewData.metrics.reportingThisWeek}/${overviewData.metrics.totalFacilities}`],
      ['Overview', 'Data completeness %', `${overviewData.metrics.completeness}%`],
      ['Overview', 'Reporting timeliness %', `${overviewData.metrics.timeliness}%`],
      ['Overview', 'Open alerts', overviewData.metrics.openAlerts],
      ['Overview', 'Facilities at stockout risk', overviewData.metrics.stockoutRisk],
      [],
      ['Sub-county', 'Facilities', 'Alert level', 'Risk index', 'Trend'],
      ...overviewData.subCounties.map((county) => [county.name, county.facilities, county.alertLevel, county.riskIndex, county.trend]),
      [],
      ['Alert ID', 'Title', 'Sub County', 'Disease', 'State', 'Officer', 'Count', 'Threshold'],
      ...overviewData.latestAlerts.map((alert) => [alert.id, alert.title, alert.subCounty, alert.disease, alert.state, alert.officer, alert.count, alert.threshold]),
    ]
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `kisumu-health-intelligence-overview-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  const exportCommodityCsv = () => {
    const rows: Array<Array<string | number>> = [
      ['Commodity', 'Unit', 'Stock on Hand', 'Monthly Consumption', '3-Month Forecast', 'Confidence Min', 'Confidence Max', 'Months of Stock', 'Risk Status', 'Facilities at Risk', 'Redistribution Suggestion'],
      ...commodityForecasts.map((f) => [f.commodity, f.unit, f.stockOnHand, f.monthlyConsumption, f.forecast3Month, f.confidenceBand.min, f.confidenceBand.max, f.monthsOfStock.toFixed(1), f.riskStatus, f.facilitiesAtRisk, f.redistributionSuggestion]),
      [],
      ['Sub-county', 'Commodity', 'Stock on Hand', 'Months of Stock', 'Risk Status'],
      ...subCountyStock.map((s) => [s.subCounty, s.commodity, s.stockOnHand, s.monthsOfStock.toFixed(1), s.riskStatus]),
    ]
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `kisumu-commodity-forecast-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  const exportDataQualityCsv = () => {
    const rows: Array<Array<string | number>> = [
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
    ]
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `kisumu-data-quality-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  const exportPilotMECsv = () => {
    const rows: Array<Array<string | number>> = [
      ['Indicator ID', 'Name', 'Current Value', 'Baseline Value', 'Target Value', 'Unit', 'Trend', 'Status'],
      ...pilotIndicators.map((i) => [i.id, i.name, i.currentValue, i.baselineValue, i.targetValue, i.unit, i.trend, i.status]),
      [],
      ['Sub-county', 'Timeliness %', 'Completeness %', 'Verification Time (h)', 'MAPE %', 'Active Users', 'Signal Action %', 'Stockout Prevention %'],
      ...subCountyPilotPerformance.map((s) => [s.subCounty, s.timeliness, s.completeness, s.verificationTime, s.mape, s.activeUsers, s.signalActionRate, s.stockoutPrevention]),
    ]
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `kisumu-pilot-me-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  const exportDataGovernanceCsv = () => {
    const rows: Array<Array<string | number>> = [
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
    ]
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `kisumu-data-governance-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  const visibleAlerts = showAllAlerts ? overviewData.latestAlerts : overviewData.latestAlerts.slice(0, 3)
  const selectedTrend = diseaseTrendSummary.find((entry) => entry.disease === selectedDisease) ?? diseaseTrendSummary[0]
  const selectedSignal = signals.find((signal) => signal.disease === selectedDisease) ?? signals[0]

  const handleGenerateDiseaseAssessment = async () => {
    setIsAnalyzingDisease(true)
    try {
      const assessment = await generateLiveDiseaseAnalysis({
        disease: selectedSignal.disease,
        subCounty: selectedSignal.subCounty,
        currentWeek: selectedSignal.currentWeek,
        actual: selectedSignal.actual,
        expectedMin: selectedSignal.expectedMin,
        expectedMax: selectedSignal.expectedMax,
        zScore: selectedSignal.zScore,
        whyFlagged: selectedSignal.whyFlagged,
        status: selectedSignal.status,
      })
      setAiDiseaseAssessments((prev) => ({ ...prev, [selectedSignal.disease]: assessment }))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      alert(`Error generating assessment: ${msg}`)
    } finally {
      setIsAnalyzingDisease(false)
    }
  }

  const handleGenerateSupplyPlan = async () => {
    setIsAnalyzingSupply(true)
    try {
      const alCommodity = commodityForecasts.find((c) => c.commodity === 'AL') || commodityForecasts[0]
      const plan = await generateSupplyOptimization(alCommodity)
      setAiSupplyPlan(plan)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      alert(`Error generating supply optimization: ${msg}`)
    } finally {
      setIsAnalyzingSupply(false)
    }
  }

  const renderTopbarActions = (onExport: () => void, syncLabel = liveSyncTime) => (
    <div className="topbar-actions">
      <RealTimeClock />
      <button
        type="button"
        className="ai-topbar-pill"
        onClick={() => setIsSettingsOpen(true)}
        title="Configure Groq Cloud API Key and LLM Model"
      >
        <span className="ai-pulse-dot" />
        <span>Groq AI: {activeModel.split('/')[1] || activeModel}</span>
      </button>
      <button
        type="button"
        className="btn-ai"
        style={{ padding: '8px 14px', fontSize: '0.82rem' }}
        onClick={() => setIsCopilotOpen(true)}
      >
        Clinical AI Copilot
      </button>
      <button
        type="button"
        className="secondary-button"
        onClick={triggerLiveSync}
        disabled={isSyncingLive}
        title="Sync live data from eCHIS, KenyaEMR & KHIS"
        style={{ padding: '6px 12px', fontSize: '0.78rem' }}
      >
        {isSyncingLive ? '↻ Syncing...' : '↻ Sync Now'}
      </button>
      <button
        type="button"
        className="secondary-button"
        onClick={() => setViewMode('landing')}
        title="View Kisumu Public Health Landing Portal"
        style={{ padding: '6px 12px', fontSize: '0.78rem' }}
      >
        🌐 Portal
      </button>
      <LiveSyncIndicator baseTime={syncLabel} />
      <button type="button" className="secondary-button" onClick={onExport}>
        Export CSV
      </button>
    </div>
  )

  // ══════════════════════════════════════════════════════════
  // RENDER: LANDING PAGE OR OPERATIONS DASHBOARD
  // ══════════════════════════════════════════════════════════
  if (viewMode === 'landing') {
    return (
      <>
        <LandingPage
          onEnterDashboard={handleEnterDashboard}
          onOpenCopilot={() => setIsCopilotOpen(true)}
        />

        {/* Groq Cloud AI Copilot Drawer */}
        <AiCopilotDrawer
          isOpen={isCopilotOpen}
          onClose={() => setIsCopilotOpen(false)}
          activeTab={activeTab}
          contextSummary="Kisumu Health Intelligence Public Portal & Operations. 261 health facilities across 7 sub-counties."
          onOpenSettings={() => {
            setIsCopilotOpen(false)
            setIsSettingsOpen(true)
          }}
        />

        {/* Groq Cloud AI Settings Modal */}
        <AiSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onSaved={() => setActiveModel(getGroqModel())}
        />

        {/* Floating AI Button */}
        <button
          type="button"
          className="ai-copilot-floating-btn"
          onClick={() => setIsCopilotOpen((prev) => !prev)}
          aria-label="Open Kisumu Health AI Copilot"
        >
          <span className="ai-pulse-dot" />
          <span>🧠 Ask Kisumu AI Copilot</span>
        </button>
      </>
    )
  }

  return (
    <div className="app-shell">
      {/* Mobile Topbar */}
      <div className="mobile-topbar">
        <button
          type="button"
          className="mobile-hamburger"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          {isMobileMenuOpen ? '✕' : '☰'}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="brand-mark" style={{ width: '32px', height: '32px', fontSize: '0.75rem' }}>KH</div>
          <strong style={{ fontSize: '0.9rem' }}>Kisumu Health Intelligence</strong>
        </div>
        <button
          type="button"
          className="btn-ai"
          style={{ padding: '6px 10px', fontSize: '0.74rem' }}
          onClick={() => setIsCopilotOpen(true)}
        >
          🧠 AI
        </button>
      </div>

      {/* Sidebar Backdrop for Mobile */}
      <div
        className={`sidebar-backdrop ${isMobileMenuOpen ? 'mobile-open' : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* ── SIDEBAR ── */}
      <aside className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        {/* Kenya National Flag Accent */}
        <div className="sidebar-flag-stripe">
          <div className="stripe-black" />
          <div className="stripe-red" />
          <div className="stripe-green" />
        </div>

        <div className="brand-block">
          <div className="brand-crest">KH</div>
          <div className="brand-text">
            <h2>Kisumu Health Intelligence</h2>
            <p>Department of Health • County 042</p>
          </div>
        </div>

        <nav className="nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <button
              key={item}
              type="button"
              className={item === activeTab ? 'nav-item active' : 'nav-item'}
              aria-current={item === activeTab ? 'page' : undefined}
              onClick={() => {
                setActiveTab(item)
                setShowAllAlerts(false)
                setIsMobileMenuOpen(false)
              }}
            >
              <span className="nav-icon">{navIcons[item]}</span>
              {item}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-info-card">
            <div className="sidebar-info-header">
              <span className="sidebar-info-title">Access Level</span>
              <span className="status-badge status-badge-online" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>Active</span>
            </div>
            <strong>County Health Manager</strong>
            <p>Access granted for all 7 sub-counties &amp; 261 health facilities.</p>
          </div>

          <button
            type="button"
            className="sidebar-btn-portal"
            onClick={() => {
              setViewMode('landing')
              setIsMobileMenuOpen(false)
            }}
          >
            ← Public Portal View
          </button>
        </div>
      </aside>

      {/* ── MAIN PANEL ── */}
      <main className="main-panel">

        {/* ══ OVERVIEW ══ */}
        {activeTab === 'Overview' ? (
          <>
            <header className="topbar">
              <div>
                <p className="eyebrow">Operations overview</p>
                <h1>Overview</h1>
              </div>
              {renderTopbarActions(exportCsv)}
            </header>

            <SystemStatusBar />

            <div className="banner" role="status">
              AI-generated signals support, not replace, epidemiological verification.
            </div>

            <section className="kpi-grid" aria-label="Overview metrics">
                  {metrics.map((metric) => (
                    <article key={metric.label} className="kpi-card">
                      <div className="kpi-topline">
                        <span>{metric.label}</span>
                        <span className="mini-dot" aria-hidden="true" />
                      </div>
                      <strong>
                        <AnimatedCounter target={metric.value} suffix={metric.suffix ?? ''} decimals={metric.decimals ?? 0} />
                      </strong>
                      <p>{metric.meta}</p>
                      <MetricProgressBar value={metric.progress} color={metric.color} />
                      <small>{metric.trend}</small>
                    </article>
                  ))}
                </section>

                <section className="content-grid">
                  <article className="panel map-panel">
                    <div className="panel-header">
                      <div>
                        <p className="eyebrow dark">Sub-county alert map</p>
                        <h3>Alert intensity by area</h3>
                      </div>
                      <span className="panel-badge">7 sub-counties</span>
                    </div>

                    <div style={{ padding: '8px 20px 0', fontSize: '0.78rem', color: '#64748b' }}>
                      Epidemiological risk indices calculated from weekly IDSR indicator thresholds (C-SUM).
                    </div>

                    <div className="county-grid" aria-label="Sub-county overview map">
                      {overviewData.subCounties.map((county) => (
                        <div key={county.name} className={`county-tile ${alertTone[county.alertLevel]}`}>
                          <div className="county-header">
                            <span>{county.name}</span>
                            <span className="county-level">{county.alertLevel}</span>
                          </div>
                          <strong>{county.riskIndex}</strong>
                          <small>{county.trend} vs prior month</small>
                        </div>
                      ))}
                    </div>
                  </article>

                  <article className="panel alert-panel">
                    <div className="panel-header">
                      <div>
                        <p className="eyebrow dark">Latest alerts</p>
                        <h3>Signals requiring review</h3>
                      </div>
                      <button type="button" className="text-button" onClick={() => setShowAllAlerts((current) => !current)}>
                        {showAllAlerts ? 'Show fewer' : 'View all'}
                      </button>
                    </div>

                    <ul className="alert-list">
                      {visibleAlerts.map((alert) => (
                        <li key={alert.id} className="alert-item">
                          <div className="alert-left">
                            <span className={`status-dot ${alertTone[alert.level]}`} />
                            <div>
                              <strong>{alert.title}</strong>
                              <p>{alert.subCounty} • {alert.disease} • {alert.age}</p>
                            </div>
                          </div>
                          <div className="alert-meta">
                            <span>{alert.state}</span>
                            <small>{alert.count} vs {alert.threshold}</small>
                            <em>{alert.officer}</em>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </article>
                </section>

                <section className="bottom-section">
                  <article className="panel dataset-panel">
                    <div className="panel-header">
                      <div>
                        <p className="eyebrow dark">Synthetic dataset</p>
                        <h3>Demo coverage snapshot</h3>
                      </div>
                    </div>
                    <div className="dataset-grid">
                      <div>
                        <span>Total facilities</span>
                        <strong>{overviewData.facilitySnapshot.totalFacilities}</strong>
                      </div>
                      <div>
                        <span>Government-owned</span>
                        <strong>{overviewData.facilitySnapshot.governmentOwned}</strong>
                      </div>
                      <div>
                        <span>Community units</span>
                        <strong>{overviewData.facilitySnapshot.communityUnits}</strong>
                      </div>
                      <div>
                        <span>CHPs</span>
                        <strong>{overviewData.facilitySnapshot.chps}</strong>
                      </div>
                    </div>
                  </article>

                  <article className="panel note-panel">
                    <div className="panel-header">
                      <div>
                        <p className="eyebrow dark">Data governance</p>
                        <h3>AI labels and controls</h3>
                      </div>
                    </div>
                    <ul className="notes-list">
                      <li>Routine facility and community data remain in eCHIS, KenyaEMR and KHIS.</li>
                      <li>AI outputs are labelled, logged and require human confirmation before action.</li>
                      <li>Only aggregated, non-patient-level data are used in the demo.</li>
                    </ul>
                  </article>
                </section>
              </>
            ) : activeTab === 'Disease Signals' ? (
          <>
            <header className="topbar">
              <div>
                <p className="eyebrow">Signal detection</p>
                <h1>Disease Signals</h1>
              </div>
              {renderTopbarActions(exportCsv)}
            </header>

            <SystemStatusBar />

            <div className="banner" role="status">
              AI-generated signals support, not replace, epidemiological verification.
            </div>

            <div className="institutional-module-header">
              <div className="module-header-meta">
                <span className="module-protocol-badge">IDSR Protocol Tier 2 • Active Outbreak Monitoring</span>
                <h2 className="module-header-title">Kisumu County Epidemiological Signal Detection</h2>
                <p className="module-header-desc">
                  Automated statistical anomaly detection (C-SUM &amp; z-score &ge; 2.0) across 261 health facilities and 7 sub-counties.
                </p>
              </div>
              <div className="module-header-controls">
                <span className="status-badge status-badge-online">Surveillance Active</span>
                <span className="panel-badge">Week {selectedSignal.currentWeek}</span>
              </div>
            </div>

            <div className="signal-grid">
              <article className="panel signal-panel">
                <div className="panel-header">
                  <div>
                    <p className="eyebrow dark">Weekly trend</p>
                    <h3>{selectedSignal.disease}</h3>
                  </div>
                  <span className="panel-badge">{selectedSignal.currentWeek}</span>
                </div>

                <div className="disease-tabs" aria-label="Disease selection">
                  {diseaseTrendSummary.map((item) => (
                    <button
                      key={item.disease}
                      type="button"
                      className={item.disease === selectedDisease ? 'disease-tab active' : 'disease-tab'}
                      onClick={() => setSelectedDisease(item.disease)}
                    >
                      {item.disease}
                    </button>
                  ))}
                </div>

                <div className="signal-summary">
                  <div>
                    <span>Sub-county</span>
                    <strong>{selectedSignal.subCounty}</strong>
                  </div>
                  <div>
                    <span>Actual</span>
                    <strong>{selectedSignal.actual}</strong>
                  </div>
                  <div>
                    <span>Expected range</span>
                    <strong>{selectedSignal.expectedMin}-{selectedSignal.expectedMax}</strong>
                  </div>
                  <div>
                    <span>z-score</span>
                    <strong>{selectedSignal.zScore}</strong>
                  </div>
                </div>

                <SignalChart values={selectedTrend.weeklyCounts} expectedMin={selectedSignal.expectedMin} expectedMax={selectedSignal.expectedMax} />

                <div className="why-flagged">
                  <strong>Why flagged</strong>
                  <p>{selectedSignal.whyFlagged}</p>
                </div>

                <div style={{ marginTop: 16, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn-ai"
                    onClick={handleGenerateDiseaseAssessment}
                    disabled={isAnalyzingDisease}
                  >
                    {isAnalyzingDisease ? (
                      <><span className="ai-pulse-dot" /> Generating Groq AI Assessment...</>
                    ) : (
                      <>⚡ Generate Live Groq AI Epidemiological Assessment</>
                    )}
                  </button>
                  <button type="button" className="btn-ai btn-ai-outline" onClick={() => setIsCopilotOpen(true)}>
                    🧠 Discuss Signal with AI Copilot
                  </button>
                </div>

                {aiDiseaseAssessments[selectedSignal.disease] && (
                  <div className="ai-assessment-card">
                    <div className="ai-assessment-header">
                      <div className="ai-assessment-badge">
                        <span className="ai-pulse-dot" /> Live Groq AI Assessment • {selectedSignal.disease} ({selectedSignal.subCounty})
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#557b85' }}>Human confirmation required</span>
                    </div>
                    <div className="ai-assessment-content">
                      {aiDiseaseAssessments[selectedSignal.disease]}
                    </div>
                  </div>
                )}
              </article>

              <aside className="panel workflow-panel">
                <div className="panel-header">
                  <div>
                    <p className="eyebrow dark">Workflow</p>
                    <h3>Signal review status</h3>
                  </div>
                </div>

                <div className="state-stack">
                  {signals.map((signal) => (
                    <div key={`${signal.disease}-${signal.subCounty}`} className="workflow-card">
                      <div className="workflow-header">
                        <span className={`status-pill ${signal.status.toLowerCase().replace(/\s+/g, '-')}`}>
                          {signal.status}
                        </span>
                        <small>{signal.assignedOfficer}</small>
                      </div>
                      <strong>{signal.disease} ({signal.subCounty})</strong>
                      <p>{signal.notes}</p>
                    </div>
                  ))}
                </div>
              </aside>
            </div>

            <section className="bottom-section disease-bottom">
              <article className="panel">
                <div className="panel-header">
                  <div>
                    <p className="eyebrow dark">Audit trail</p>
                    <h3>{selectedSignal.disease} review notes</h3>
                  </div>
                </div>
                <ul className="audit-list">
                  {selectedSignal.auditTrail.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    placeholder="Add clinical or field verification note..."
                    value={newAuditNote}
                    onChange={(e) => setNewAuditNote(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddAuditNote(selectedSignal.disease) }}
                    style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #b7ced2', fontSize: '0.84rem', outline: 'none' }}
                  />
                  <button type="button" className="btn-ai" style={{ padding: '8px 14px', fontSize: '0.82rem' }} onClick={() => handleAddAuditNote(selectedSignal.disease)}>
                    Add Note
                  </button>
                </div>
              </article>

              <article className="panel">
                <div className="panel-header">
                  <div>
                    <p className="eyebrow dark">Assigned officer &amp; Review</p>
                    <h3>{selectedSignal.assignedOfficer}</h3>
                  </div>
                </div>
                <div className="officer-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span className={`status-pill ${selectedSignal.level}`}>{selectedSignal.level} priority</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Workflow State:</span>
                      <select
                        className="workflow-status-select"
                        value={selectedSignal.status}
                        onChange={(e) => handleUpdateSignalStatus(selectedSignal.disease, e.target.value as DiseaseSignal['status'])}
                      >
                        <option value="Unverified">Unverified</option>
                        <option value="Under investigation">Under investigation</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Dismissed">Dismissed</option>
                      </select>
                    </div>
                  </div>
                  <p>{selectedSignal.notes}</p>
                </div>
              </article>
            </section>
          </>

        ) : activeTab === 'Commodity Forecast' ? (
          <>
            <header className="topbar">
              <div>
                <p className="eyebrow">Supply chain intelligence</p>
                <h1>Commodity Forecast</h1>
              </div>
              {renderTopbarActions(exportCommodityCsv)}
            </header>

            <SystemStatusBar />

            <div className="banner" role="status">
              AI-generated forecasts support, not replace, supply chain review. Redistribution suggestions require human approval.
            </div>

            <div className="institutional-module-header">
              <div className="module-header-meta">
                <span className="module-protocol-badge">Supply Chain Protocol • KEMSA Buffer Integration</span>
                <h2 className="module-header-title">3-Month Essential Medicines Forecast &amp; Stock Monitoring</h2>
                <p className="module-header-desc">
                  Predictive consumption modeling for priority antimalarials, antibiotics, and diarrhoeal commodities across public health facilities.
                </p>
              </div>
              <div className="module-header-controls">
                <span className="status-badge status-badge-online">KEMSA API Synced</span>
                <span className="panel-badge">{commoditySummary.dataSource}</span>
              </div>
            </div>

            <section className="kpi-grid" aria-label="Commodity risk overview">
              {commodityForecasts.map((item) => (
                <article key={item.commodity} className="kpi-card">
                  <div className="kpi-topline">
                    <span>{item.commodity}</span>
                    <span className={`mini-dot ${item.riskStatus.toLowerCase()}`} aria-hidden="true" />
                  </div>
                  <strong>{item.monthsOfStock.toFixed(1)} mo</strong>
                  <p>Stock on hand: {item.stockOnHand.toLocaleString()} {item.unit}</p>
                  <MetricProgressBar
                    value={item.monthsOfStock}
                    max={6}
                    color={item.monthsOfStock < 2 ? 'red' : item.monthsOfStock < 3 ? 'amber' : 'green'}
                  />
                  <small>Risk: {item.riskStatus} • {item.facilitiesAtRisk} facilities at risk</small>
                </article>
              ))}
            </section>

            <section className="content-grid">
              <article className="panel map-panel">
                <div className="panel-header">
                  <div>
                    <p className="eyebrow dark">County-level forecast</p>
                    <h3>3-month demand vs stock</h3>
                  </div>
                  <span className="panel-badge">{commoditySummary.dataSource}</span>
                </div>

                <div className="commodity-table" role="table" aria-label="Commodity forecast table">
                  <div className="table-header cols-7">
                    <span>Commodity</span>
                    <span>Stock on Hand</span>
                    <span>Monthly Use</span>
                    <span>3-Mo Forecast</span>
                    <span>Confidence Band</span>
                    <span>Months of Stock</span>
                    <span>Risk</span>
                  </div>
                  {commodityForecasts.map((item) => (
                    <div key={item.commodity} className={`table-row cols-7 ${item.riskStatus.toLowerCase()}`}>
                      <span><strong>{item.commodity}</strong></span>
                      <span>{item.stockOnHand.toLocaleString()} {item.unit}</span>
                      <span>{item.monthlyConsumption.toLocaleString()}/mo</span>
                      <span>{item.forecast3Month.toLocaleString()}</span>
                      <span>{item.confidenceBand.min.toLocaleString()}–{item.confidenceBand.max.toLocaleString()}</span>
                      <span>{item.monthsOfStock.toFixed(1)}</span>
                      <span><span className={`status-pill ${item.riskStatus.toLowerCase()}`}>{item.riskStatus}</span></span>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 16, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <button type="button" className="btn-ai" onClick={handleGenerateSupplyPlan} disabled={isAnalyzingSupply}>
                    {isAnalyzingSupply ? (
                      <><span className="ai-pulse-dot" /> Optimizing with Groq Cloud...</>
                    ) : (
                      <>⚡ Optimize Supply Distribution with Groq AI</>
                    )}
                  </button>
                  <button type="button" className="btn-ai btn-ai-outline" onClick={() => setIsCopilotOpen(true)}>
                    🧠 Discuss Stockouts with Copilot
                  </button>
                </div>

                {aiSupplyPlan && (
                  <div className="ai-assessment-card">
                    <div className="ai-assessment-header">
                      <div className="ai-assessment-badge">
                        <span className="ai-pulse-dot" /> Groq AI Supply Chain Strategy Brief
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#557b85' }}>Requires County Pharmacist Approval</span>
                    </div>
                    <div className="ai-assessment-content">{aiSupplyPlan}</div>
                  </div>
                )}

                <div className="why-flagged" style={{ marginTop: 16 }}>
                  <strong>Redistribution suggestions (Human approval required)</strong>
                  <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {commodityForecasts.map((f) => (
                      <div key={f.commodity} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2ecee', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ flex: 1, minWidth: '240px' }}>
                          <strong>{f.commodity}:</strong> <span style={{ color: '#32555e' }}>{f.redistributionSuggestion}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span className={`status-pill ${commodityApprovals[f.commodity]?.toLowerCase() || 'pending'}`}>
                            {commodityApprovals[f.commodity] || 'Pending'}
                          </span>
                          <button type="button" className="btn-ai" style={{ padding: '5px 12px', fontSize: '0.76rem' }} onClick={() => handleApprovalChange(f.commodity, 'Approved')}>Approve</button>
                          <button type="button" className="secondary-button" style={{ padding: '5px 12px', fontSize: '0.76rem' }} onClick={() => handleApprovalChange(f.commodity, 'Escalated')}>Escalate KEMSA</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </article>

              <aside className="panel workflow-panel">
                <div className="panel-header">
                  <div>
                    <p className="eyebrow dark">Sub-county risk</p>
                    <h3>Stock status by area</h3>
                  </div>
                </div>
                <div className="state-stack">
                  {['AL', 'Malaria RDT', 'Amoxicillin DT', 'ORS', 'Zinc'].map((commodity) => (
                    <div key={commodity} className="workflow-card">
                      <div className="workflow-header">
                        <strong>{commodity}</strong>
                        <small>{commoditySummary.totalFacilities} facilities</small>
                      </div>
                      <div className="subcounty-mini-grid">
                        {subCountyStock
                          .filter((s) => s.commodity === commodity)
                          .map((stock) => (
                            <div key={stock.subCounty} className={`county-tile ${stock.riskStatus.toLowerCase()}`} style={{ minHeight: 'auto', padding: '10px 12px' }}>
                              <div className="county-header">
                                <span>{stock.subCounty}</span>
                                <span className="county-level">{stock.riskStatus}</span>
                              </div>
                              <strong>{stock.monthsOfStock.toFixed(1)} mo</strong>
                              <small>{stock.stockOnHand.toLocaleString()} units</small>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </aside>
            </section>

            <section className="bottom-section disease-bottom">
              <article className="panel">
                <div className="panel-header">
                  <div>
                    <p className="eyebrow dark">Forecast methodology</p>
                    <h3>How forecasts are generated</h3>
                  </div>
                </div>
                <ul className="notes-list">
                  <li>Seasonal naive baseline with 52-week seasonality for stable commodities (AL, ORS, Zinc).</li>
                  <li>Holt-Winters additive model for commodities with trend (Amoxicillin DT, Malaria RDT).</li>
                  <li>Confidence bands: ±10% for stable, ±15% for trending commodities.</li>
                  <li>Forecasts updated weekly after KenyaEMR and eLMIS sync.</li>
                </ul>
              </article>

              <article className="panel">
                <div className="panel-header">
                  <div>
                    <p className="eyebrow dark">Data coverage</p>
                    <h3>Reporting status</h3>
                  </div>
                </div>
                <div className="dataset-grid">
                  <div><span>Facilities in county</span><strong>{commoditySummary.totalFacilities}</strong></div>
                  <div><span>Reporting this cycle</span><strong>{commoditySummary.facilitiesReporting}</strong></div>
                  <div><span>Overall risk level</span><strong><span className={`status-pill ${commoditySummary.overallRisk.toLowerCase()}`}>{commoditySummary.overallRisk}</span></strong></div>
                  <div><span>Last sync</span><strong>{liveSyncTime}</strong></div>
                </div>
              </article>
            </section>
          </>

        ) : activeTab === 'Data Quality' ? (
          <>
            <header className="topbar">
              <div>
                <p className="eyebrow">Data validation</p>
                <h1>Data Quality</h1>
              </div>
              {renderTopbarActions(exportDataQualityCsv)}
            </header>

            <SystemStatusBar />

            <div className="banner" role="status">
              Data quality metrics are computed from eCHIS, KenyaEMR and KHIS. Facilities with validation failures are flagged for follow-up.
            </div>

            <section className="kpi-grid" aria-label="Data quality overview">
              <article className="kpi-card">
                <div className="kpi-topline"><span>Overall completeness</span><span className="mini-dot" aria-hidden="true" /></div>
                <strong><AnimatedCounter target={dataQualitySummary.overallCompleteness} suffix="%" decimals={1} /></strong>
                <p>Target: ≥95%</p>
                <MetricProgressBar value={dataQualitySummary.overallCompleteness} color="teal" />
                <small>+2.1 pts vs baseline</small>
              </article>
              <article className="kpi-card">
                <div className="kpi-topline"><span>Overall timeliness</span><span className="mini-dot" aria-hidden="true" /></div>
                <strong><AnimatedCounter target={dataQualitySummary.overallTimeliness} suffix="%" decimals={1} /></strong>
                <p>Target: ≥90%</p>
                <MetricProgressBar value={dataQualitySummary.overallTimeliness} color="green" />
                <small>+4.6 pts vs baseline</small>
              </article>
              <article className="kpi-card">
                <div className="kpi-topline"><span>Validation pass rate</span><span className="mini-dot" aria-hidden="true" /></div>
                <strong><AnimatedCounter target={dataQualitySummary.validationPassRate} suffix="%" decimals={1} /></strong>
                <p>{dataQualitySummary.facilitiesWithIssues} facilities with issues</p>
                <MetricProgressBar value={dataQualitySummary.validationPassRate} color="teal" />
                <small>Down from 12 last week</small>
              </article>
              <article className="kpi-card">
                <div className="kpi-topline"><span>Not reporting</span><span className="mini-dot critical" aria-hidden="true" /></div>
                <strong><AnimatedCounter target={dataQualitySummary.facilitiesNotReporting} /></strong>
                <p>{'Facilities silent >7 days'}</p>
                <MetricProgressBar value={(dataQualitySummary.facilitiesNotReporting / 20) * 100} color="red" />
                <small>Escalation initiated</small>
              </article>
              <article className="kpi-card">
                <div className="kpi-topline"><span>Sources connected</span><span className="mini-dot" aria-hidden="true" /></div>
                <strong>3/3</strong>
                <p>All sources syncing</p>
                <MetricProgressBar value={100} color="green" />
                <small>Last: {liveSyncTime}</small>
              </article>
            </section>

            <section className="content-grid">
              <article className="panel map-panel">
                <div className="panel-header">
                  <div>
                    <p className="eyebrow dark">Source system health</p>
                    <h3>Completeness &amp; timeliness by source</h3>
                  </div>
                  <span className="panel-badge">3 sources</span>
                </div>
                <div className="commodity-table" role="table" aria-label="Source quality table">
                  <div className="table-header cols-7">
                    <span>Source</span>
                    <span>Connected</span>
                    <span>Reporting</span>
                    <span>Completeness</span>
                    <span>Timeliness</span>
                    <span>Last Sync</span>
                    <span>Val. Errors</span>
                  </div>
                  {sourceQuality.map((src) => (
                    <div key={src.source} className="table-row cols-7">
                      <span><strong>{src.source}</strong></span>
                      <span>{src.facilitiesConnected}</span>
                      <span>{src.facilitiesReporting}</span>
                      <span>{src.completeness}%</span>
                      <span>{src.timeliness}%</span>
                      <span>{liveSyncTime}</span>
                      <span>
                        <span className={src.validationErrors > 10 ? 'status-pill high' : src.validationErrors > 5 ? 'status-pill moderate' : 'status-pill low'}>
                          {src.validationErrors}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </article>

              <aside className="panel workflow-panel">
                <div className="panel-header">
                  <div>
                    <p className="eyebrow dark">Critical issues</p>
                    <h3>Facilities requiring action</h3>
                  </div>
                </div>
                <ul className="alert-list">
                  {dataQualityIssues.slice(0, 5).map((issue) => (
                    <li key={`${issue.facility}-${issue.issue}`} className="alert-item">
                      <div className="alert-left">
                        <span className={`status-dot ${issue.severity.toLowerCase()}`} />
                        <div>
                          <strong>{issue.facility}</strong>
                          <p>{issue.subCounty} • {issue.source}</p>
                        </div>
                      </div>
                      <div className="alert-meta">
                        <span className={`status-pill ${issue.severity.toLowerCase()}`}>{issue.severity}</span>
                        <small>{issue.daysSinceReport} days ago</small>
                      </div>
                    </li>
                  ))}
                </ul>
              </aside>
            </section>

            <section className="bottom-section disease-bottom">
              <article className="panel">
                <div className="panel-header">
                  <div>
                    <p className="eyebrow dark">Facility reporting detail</p>
                    <h3>Completeness &amp; timeliness by facility</h3>
                  </div>
                  <span className="panel-badge">{facilityReporting.length} facilities shown</span>
                </div>
                <div className="commodity-table" role="table" aria-label="Facility reporting table">
                  <div className="table-header cols-8">
                    <span>Facility</span>
                    <span>Sub-county</span>
                    <span>Source</span>
                    <span>Last Report</span>
                    <span>Completeness</span>
                    <span>Timeliness</span>
                    <span>Validation</span>
                    <span>Issues</span>
                  </div>
                  {facilityReporting.map((fac) => (
                    <div
                      key={fac.facility}
                      className={`table-row cols-8 ${fac.validationStatus.toLowerCase() === 'failed' ? 'critical' : fac.validationStatus.toLowerCase() === 'pending' ? 'moderate' : ''}`}
                    >
                      <span>{fac.facility}</span>
                      <span>{fac.subCounty}</span>
                      <span>{fac.source}</span>
                      <span>{fac.lastReport}</span>
                      <span>{fac.completeness}%</span>
                      <span>{fac.timeliness}%</span>
                      <span><span className={`status-pill ${fac.validationStatus.toLowerCase()}`}>{fac.validationStatus}</span></span>
                      <span>{fac.issuesCount}</span>
                    </div>
                  ))}
                </div>
              </article>

              <article className="panel">
                <div className="panel-header">
                  <div>
                    <p className="eyebrow dark">Non-reporting facilities</p>
                    <h3>{'Silent >7 days'}</h3>
                  </div>
                </div>
                <ul className="alert-list">
                  {facilitiesNotReporting.map((fac) => (
                    <li key={fac.facility} className="alert-item">
                      <div className="alert-left">
                        <span className="status-dot critical" />
                        <div>
                          <strong>{fac.facility}</strong>
                          <p>{fac.subCounty} • {fac.source}</p>
                        </div>
                      </div>
                      <div className="alert-meta">
                        <span className="status-pill critical">Critical</span>
                        <small>{fac.daysSinceLastReport} days silent</small>
                      </div>
                    </li>
                  ))}
                </ul>
              </article>
            </section>
          </>

        ) : activeTab === 'Pilot M&E' ? (
          <>
            <header className="topbar">
              <div>
                <p className="eyebrow">Monitoring &amp; evaluation</p>
                <h1>Pilot M&amp;E</h1>
              </div>
              {renderTopbarActions(exportPilotMECsv, pilotMESummary.reportingPeriod)}
            </header>

            <SystemStatusBar />

            <div className="banner" role="status">
              Pilot indicators tracked across 7 sub-counties and 261 facilities. Baseline from pre-pilot period (Weeks 1-34, 2026).
            </div>

            <section className="kpi-grid" aria-label="Pilot M&E overview">
              {pilotIndicators.map((indicator) => (
                <article key={indicator.id} className="kpi-card">
                  <div className="kpi-topline">
                    <span>{indicator.name}</span>
                    <span
                      className={`mini-dot ${indicator.trend === 'improving' ? 'low' : indicator.trend === 'declining' ? 'critical' : 'moderate'}`}
                      aria-hidden="true"
                    />
                  </div>
                  <strong>
                    {typeof indicator.currentValue === 'number'
                      ? indicator.currentValue.toFixed(indicator.unit === '%' ? 1 : 0)
                      : indicator.currentValue}{' '}
                    {indicator.unit}
                  </strong>
                  <p>
                    Baseline:{' '}
                    {typeof indicator.baselineValue === 'number'
                      ? indicator.baselineValue.toFixed(indicator.unit === '%' ? 1 : 0)
                      : indicator.baselineValue}{' '}
                    {indicator.unit} • Target: {indicator.targetValue} {indicator.unit}
                  </p>
                  <small>
                    <span className={`status-pill ${indicator.status.toLowerCase().replace(' ', '-')}`}>{indicator.status}</span>{' '}
                    {indicator.trend}
                  </small>
                </article>
              ))}
            </section>

            <section className="content-grid">
              <article className="panel map-panel" style={{ gridColumn: '1 / -1' }}>
                <div className="panel-header">
                  <div>
                    <p className="eyebrow dark">Indicator trends</p>
                    <h3>Weekly progress vs baseline (8-week window)</h3>
                  </div>
                  <span className="panel-badge">7 sub-counties • 261 facilities</span>
                </div>

                <div className="signal-summary" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
                  {Object.entries(pilotTrendData).map(([key, values]) => (
                    <div key={key} style={{ textAlign: 'center' }}>
                      <span style={{ textTransform: 'capitalize', fontSize: '0.7rem' }}>
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <strong style={{ fontSize: '1.3rem' }}>
                        {values[values.length - 1]}
                        {key === 'verificationTime' || key === 'mape' ? '' : key === 'activeUsers' ? '' : '%'}
                      </strong>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginTop: '16px' }}>
                  {Object.entries(pilotTrendData).map(([key, values]) => (
                    <div key={key} style={{ background: 'rgba(13, 111, 122, 0.04)', borderRadius: '12px', padding: '12px', border: '1px solid rgba(13, 111, 122, 0.08)' }}>
                      <strong style={{ display: 'block', marginBottom: '8px', textTransform: 'capitalize', fontSize: '0.85rem' }}>
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </strong>
                      <svg viewBox="0 0 300 120" className="signal-chart" style={{ width: '100%', height: '100px' }}>
                        <defs>
                          <linearGradient id={`trendFill-${key}`} x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="#a9e0dd" stopOpacity="0.7" />
                            <stop offset="100%" stopColor="#a9e0dd" stopOpacity="0.1" />
                          </linearGradient>
                        </defs>
                        {(() => {
                          const minV = Math.min(...values)
                          const maxV = Math.max(...values)
                          const range = maxV - minV || 1
                          const w = 280
                          const h = 90
                          const path = values.map((v, i) => {
                            const x = 10 + (i * w) / (values.length - 1)
                            const y = h - ((v - minV) / range) * h
                            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
                          }).join(' ')
                          const areaPath = values.map((v, i) => {
                            const x = 10 + (i * w) / (values.length - 1)
                            const y = h - ((v - minV) / range) * h
                            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
                          }).join(' ') + ` L ${w + 10} ${h} L 10 ${h} Z`
                          return (
                            <>
                              <path d={areaPath} fill={`url(#trendFill-${key})`} />
                              <path d={path} fill="none" stroke="#0d6f7a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                              {values.map((v, i) => {
                                const x = 10 + (i * w) / (values.length - 1)
                                const y = h - ((v - minV) / range) * h
                                return <circle key={i} cx={x} cy={y} r="3" fill="#0d6f7a" />
                              })}
                            </>
                          )
                        })()}
                      </svg>
                    </div>
                  ))}
                </div>
              </article>
            </section>

            <section className="bottom-section disease-bottom">
              <article className="panel">
                <div className="panel-header">
                  <div>
                    <p className="eyebrow dark">Sub-county performance</p>
                    <h3>Indicator breakdown by sub-county</h3>
                  </div>
                </div>
                <div className="commodity-table" role="table" aria-label="Sub-county pilot performance">
                  <div className="table-header cols-8">
                    <span>Sub-county</span>
                    <span>Timeliness %</span>
                    <span>Completeness %</span>
                    <span>Verify Time (h)</span>
                    <span>MAPE %</span>
                    <span>Active Users</span>
                    <span>Signal Action %</span>
                    <span>Stockout Prev %</span>
                  </div>
                  {subCountyPilotPerformance.map((sc) => (
                    <div key={sc.subCounty} className="table-row cols-8">
                      <span><strong>{sc.subCounty}</strong></span>
                      <span>{sc.timeliness}%</span>
                      <span>{sc.completeness}%</span>
                      <span>{sc.verificationTime}h</span>
                      <span>{sc.mape}%</span>
                      <span>{sc.activeUsers}</span>
                      <span>{sc.signalActionRate}%</span>
                      <span>{sc.stockoutPrevention}%</span>
                    </div>
                  ))}
                </div>
              </article>

              <article className="panel">
                <div className="panel-header">
                  <div>
                    <p className="eyebrow dark">Pilot summary</p>
                    <h3>Overall status</h3>
                  </div>
                </div>
                <div className="dataset-grid">
                  <div><span>Active sub-counties</span><strong>{pilotMESummary.activePilotSubCounties}</strong></div>
                  <div><span>Facilities in pilot</span><strong>{pilotMESummary.totalFacilitiesInPilot}</strong></div>
                  <div><span>Weekly active users</span><strong>{pilotMESummary.weeklyActiveUsers}</strong></div>
                  <div><span>Overall status</span><strong><span className={`status-pill ${pilotMESummary.overallStatus.toLowerCase().replace(' ', '-')}`}>{pilotMESummary.overallStatus}</span></strong></div>
                </div>
                <div className="why-flagged" style={{ marginTop: 16 }}>
                  <strong>Indicators at risk</strong>
                  <p>{pilotIndicators.filter((i) => i.status === 'At Risk' || i.status === 'Off Track').map((i) => i.name).join(', ') || 'None'}</p>
                </div>
              </article>
            </section>
          </>

        ) : activeTab === 'Data & Governance' ? (
          <>
            <header className="topbar">
              <div>
                <p className="eyebrow">System governance</p>
                <h1>Data &amp; Governance</h1>
              </div>
              {renderTopbarActions(exportDataGovernanceCsv)}
            </header>

            <SystemStatusBar />

            <div className="banner" role="status">
              Governance framework aligned with Kenya Data Protection Act (2019) and Digital Health Act (2023). AI outputs labelled, logged, and require human confirmation.
            </div>

            <div className="institutional-module-header">
              <div className="module-header-meta">
                <span className="module-protocol-badge">Statutory Compliance • Office of Data Protection Commissioner</span>
                <h2 className="module-header-title">Data Protection, Provenance &amp; Clinical Governance</h2>
                <p className="module-header-desc">
                  Governed under Kenya Data Protection Act (2019) &amp; Digital Health Act (2023). Strict RBAC, de-identification, and human-in-the-loop audit verification.
                </p>
              </div>
              <div className="module-header-controls">
                <span className="status-badge status-badge-online">Compliance Score: 87%</span>
                <span className="panel-badge">Target: &ge;90%</span>
              </div>
            </div>

            <section className="kpi-grid" aria-label="Governance overview">
              <article className="kpi-card">
                <div className="kpi-topline"><span>Compliance score</span><span className="mini-dot" aria-hidden="true" /></div>
                <strong><AnimatedCounter target={dataGovernanceSummary.complianceScore} suffix="%" /></strong>
                <p>Target: ≥90%</p>
                <MetricProgressBar value={dataGovernanceSummary.complianceScore} color="teal" />
                <small>Next review: {dataGovernanceSummary.nextReview}</small>
              </article>
              <article className="kpi-card">
                <div className="kpi-topline"><span>Connected sources</span><span className="mini-dot" aria-hidden="true" /></div>
                <strong><AnimatedCounter target={dataSources.length} /></strong>
                <p>All syncing normally</p>
                <MetricProgressBar value={100} color="green" />
                <small>Last: {liveSyncTime}</small>
              </article>
              <article className="kpi-card">
                <div className="kpi-topline"><span>Active roles</span><span className="mini-dot" aria-hidden="true" /></div>
                <strong><AnimatedCounter target={rolePermissions.length} /></strong>
                <p>{rolePermissions.reduce((sum, r) => sum + r.userCount, 0)} total users</p>
                <MetricProgressBar value={(rolePermissions.length / 5) * 100} color="teal" />
                <small>RBAC enforced</small>
              </article>
              <article className="kpi-card">
                <div className="kpi-topline"><span>Governance notes</span><span className="mini-dot" aria-hidden="true" /></div>
                <strong><AnimatedCounter target={governanceNotes.length} /></strong>
                <p>{dataGovernanceSummary.notesImplemented} implemented</p>
                <MetricProgressBar value={(dataGovernanceSummary.notesImplemented / governanceNotes.length) * 100} color="green" />
                <small>{dataGovernanceSummary.criticalGaps} critical gaps</small>
              </article>
              <article className="kpi-card">
                <div className="kpi-topline"><span>Access logs (24h)</span><span className="mini-dot" aria-hidden="true" /></div>
                <strong><AnimatedCounter target={accessLog.length} /></strong>
                <p>All successful</p>
                <MetricProgressBar value={100} color="green" />
                <small>No failed attempts</small>
              </article>
            </section>

            <section className="content-grid">
              <article className="panel map-panel">
                <div className="panel-header">
                  <div>
                    <p className="eyebrow dark">Connected data sources</p>
                    <h3>Sync status and coverage</h3>
                  </div>
                  <span className="panel-badge">3 sources</span>
                </div>
                <div className="commodity-table" role="table" aria-label="Data sources table">
                  <div className="table-header cols-7">
                    <span>Source</span>
                    <span>Type</span>
                    <span>Status</span>
                    <span>Facilities</span>
                    <span>Records (24h)</span>
                    <span>Last Sync</span>
                    <span>Frequency</span>
                  </div>
                  {dataSources.map((src) => (
                    <div key={src.name} className="table-row cols-7">
                      <span><strong>{src.name}</strong></span>
                      <span>{src.type}</span>
                      <span><span className={`status-pill ${src.status.toLowerCase()}`}>{src.status}</span></span>
                      <span>{src.facilitiesCovered}</span>
                      <span>{src.recordsSynced.toLocaleString()}</span>
                      <span>{liveSyncTime}</span>
                      <span>{src.syncFrequency}</span>
                    </div>
                  ))}
                </div>
              </article>

              <aside className="panel workflow-panel">
                <div className="panel-header">
                  <div>
                    <p className="eyebrow dark">Role permissions</p>
                    <h3>Access control matrix</h3>
                  </div>
                </div>
                <div className="state-stack">
                  {rolePermissions.map((role) => (
                    <div key={role.role} className="workflow-card">
                      <div className="workflow-header">
                        <strong>{role.role}</strong>
                        <small>{role.userCount} users</small>
                      </div>
                      <p style={{ color: '#4a6875', fontSize: '0.82rem', marginBottom: '8px' }}>{role.description}</p>
                      <ul style={{ margin: 0, paddingLeft: 16, fontSize: '0.78rem', color: '#4a6875' }}>
                        {role.permissions.map((p) => <li key={p}>{p}</li>)}
                      </ul>
                      <small style={{ color: '#6b8a94' }}>Last access: {role.lastAccess}</small>
                    </div>
                  ))}
                </div>
              </aside>
            </section>

            <section className="bottom-section disease-bottom">
              <article className="panel" style={{ gridColumn: '1 / -1' }}>
                <div className="panel-header">
                  <div>
                    <p className="eyebrow dark">Recent access log</p>
                    <h3>Last 10 access events</h3>
                  </div>
                </div>
                <div className="commodity-table" role="table" aria-label="Access log table">
                  <div className="table-header cols-6">
                    <span>Time</span>
                    <span>User</span>
                    <span>Role</span>
                    <span>Action</span>
                    <span>Resource</span>
                    <span>Status</span>
                  </div>
                  {accessLog.map((log, idx) => (
                    <div key={idx} className="table-row cols-6">
                      <span>{log.timestamp}</span>
                      <span>{log.user}</span>
                      <span>{log.role}</span>
                      <span>{log.action}</span>
                      <span>{log.resource}</span>
                      <span><span className={`status-pill ${log.status.toLowerCase()}`}>{log.status}</span></span>
                    </div>
                  ))}
                </div>
              </article>
            </section>

            <section className="bottom-section disease-bottom" style={{ marginTop: 22 }}>
              <article className="panel" style={{ gridColumn: '1 / -1' }}>
                <div className="panel-header">
                  <div>
                    <p className="eyebrow dark">Governance register</p>
                    <h3>Data protection, AI provenance &amp; human confirmation</h3>
                  </div>
                </div>
                <div className="commodity-table" role="table" aria-label="Governance notes table">
                  <div className="table-header cols-4">
                    <span>Category</span>
                    <span>Title</span>
                    <span>Status</span>
                    <span>Reference</span>
                  </div>
                  {governanceNotes.map((note) => (
                    <div key={note.id} className="table-row cols-4">
                      <span>
                        <span className={`status-pill ${note.category.toLowerCase().replace(' ', '-').replace('&', '')}`}>
                          {note.category}
                        </span>
                      </span>
                      <span><strong>{note.title}</strong></span>
                      <span><span className={`status-pill ${note.status.toLowerCase().replace(' ', '-')}`}>{note.status}</span></span>
                      <span>{note.reference}</span>
                    </div>
                  ))}
                </div>
                <div className="why-flagged" style={{ marginTop: 16 }}>
                  <strong>Critical gaps</strong>
                  <p>MFA rollout for all roles (In Progress); Data retention policy automation (Planned). Target resolution: Q2 2027.</p>
                </div>
              </article>
            </section>
          </>

        ) : null}
      </main>

      {/* Groq Cloud AI Copilot Drawer */}
      <AiCopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        activeTab={activeTab}
        contextSummary={`Kisumu Health Intelligence operations dashboard. Tab: ${activeTab}. Facilities: 261, Sub-counties: 7.`}
        onOpenSettings={() => {
          setIsCopilotOpen(false)
          setIsSettingsOpen(true)
        }}
      />

      {/* Groq Cloud AI Settings Modal */}
      <AiSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSaved={() => setActiveModel(getGroqModel())}
      />

      {/* Clinical Decision Support Floating Launcher */}
      <button
        type="button"
        className="ai-copilot-floating-btn"
        onClick={() => setIsCopilotOpen((prev) => !prev)}
        aria-label="Open Clinical AI Decision Support"
      >
        <span className="status-badge-dot" style={{ background: '#2dd4bf' }} />
        <span>Clinical AI Assistant</span>
      </button>
    </div>
  )
}

export default App
