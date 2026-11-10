import { useState, useEffect } from 'react';
import { RealTimeClock, StatusBadge } from './RealtimeWidgets';
import {
  KISUMU_FACILITIES,
  INITIAL_LIVE_EVENTS,
  subscribeToLiveEvents,
  emitSimulatedLiveEvent,
  type LiveHealthEvent,
} from '../services/realtimeEngine';
import { overviewData } from '../services/overviewData';

interface LandingPageProps {
  onEnterDashboard: (targetTab?: string) => void;
  onOpenCopilot: () => void;
}

export function LandingPage({ onEnterDashboard, onOpenCopilot }: LandingPageProps) {
  const [liveEvents, setLiveEvents] = useState<LiveHealthEvent[]>(INITIAL_LIVE_EVENTS);
  const [facilitySearch, setFacilitySearch] = useState('');
  const [selectedSubCountyFilter, setSelectedSubCountyFilter] = useState('All');
  const [isLiveStreaming, setIsLiveStreaming] = useState(true);

  // Subscribe to real-time events and interval simulator
  useEffect(() => {
    const unsubscribe = subscribeToLiveEvents((newEvent) => {
      setLiveEvents((prev) => [newEvent, ...prev.slice(0, 9)]);
    });

    if (!isLiveStreaming) return unsubscribe;

    const interval = setInterval(() => {
      emitSimulatedLiveEvent();
    }, 12000); // New telemetry event every 12s

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [isLiveStreaming]);

  const filteredFacilities = KISUMU_FACILITIES.filter((f) => {
    const matchesSearch =
      f.name.toLowerCase().includes(facilitySearch.toLowerCase()) ||
      f.subCounty.toLowerCase().includes(facilitySearch.toLowerCase()) ||
      f.system.toLowerCase().includes(facilitySearch.toLowerCase());
    const matchesSubCounty =
      selectedSubCountyFilter === 'All' || f.subCounty === selectedSubCountyFilter;
    return matchesSearch && matchesSubCounty;
  });

  const subCounties = [
    { name: 'Kisumu Central', level: 'Moderate', riskIndex: 1.2, facilities: 48, trend: '+3%' },
    { name: 'Nyakach', level: 'Critical', riskIndex: 3.8, facilities: 36, trend: '+18%' },
    { name: 'Nyando', level: 'High', riskIndex: 2.6, facilities: 42, trend: '+11%' },
    { name: 'Kisumu West', level: 'Moderate', riskIndex: 1.5, facilities: 38, trend: '-2%' },
    { name: 'Kisumu East', level: 'Low', riskIndex: 0.8, facilities: 35, trend: '-5%' },
    { name: 'Seme', level: 'Low', riskIndex: 0.9, facilities: 32, trend: '-1%' },
    { name: 'Muhoroni', level: 'Moderate', riskIndex: 1.4, facilities: 30, trend: '+4%' },
  ];

  return (
    <div className="landing-root">
      {/* Kenya Flag Stripe */}
      <div className="sidebar-flag-stripe">
        <div className="stripe-black" />
        <div className="stripe-red" />
        <div className="stripe-green" />
      </div>

      {/* ── LANDING NAVIGATION ── */}
      <header className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-brand">
            <div className="brand-crest">KH</div>
            <div>
              <div className="landing-kenya-eyebrow">REPUBLIC OF KENYA • COUNTY GOVERNMENT OF KISUMU</div>
              <h1 className="landing-brand-title">Department of Health Services — Health Intelligence Portal</h1>
            </div>
          </div>

          <div className="landing-nav-right">
            <div className="landing-clock-box">
              <span className="live-dot" />
              <RealTimeClock />
            </div>

            <div className="landing-live-status-pill">
              <StatusBadge status="online" label="Surveillance Active (261 Facilities)" />
            </div>

            <button
              type="button"
              className="btn-ai btn-landing-ai"
              onClick={onOpenCopilot}
              title="Open Groq Cloud Health Copilot"
            >
              Clinical AI Copilot
            </button>

            <button
              type="button"
              className="btn-primary-launch"
              onClick={() => onEnterDashboard('Overview')}
            >
              Launch Dashboard →
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO BANNER ── */}
      <section className="landing-hero">
        <div className="landing-hero-content">
          <div className="landing-hero-badge">
            <span className="status-badge-dot" style={{ background: '#2dd4bf' }} />
            <span>IDSR Surveillance &amp; Epidemic Intelligence • Kisumu County Health Directorate</span>
          </div>

          <h2 className="landing-hero-title">
            Integrated Disease Surveillance &amp; Clinical Health Intelligence System
          </h2>

          <p className="landing-hero-desc">
            Unified data telemetry integrating <strong>eCHIS</strong> Community Health Promoters, <strong>KenyaEMR</strong> clinical hospital systems,
            and <strong>KHIS</strong> national reporting. Enhanced with <strong>Groq Cloud AI Decision Support</strong> for automated epidemiological early warning
            and KEMSA commodity redistribution across Kisumu's 7 sub-counties.
          </p>

          <div className="landing-cta-row">
            <button
              type="button"
              className="btn-hero-primary"
              onClick={() => onEnterDashboard('Overview')}
            >
              Launch Operations Dashboard →
            </button>
            <button
              type="button"
              className="btn-hero-secondary"
              onClick={() => onEnterDashboard('Disease Signals')}
            >
              Disease Surveillance Tracker
            </button>
            <button
              type="button"
              className="btn-hero-ai"
              onClick={onOpenCopilot}
            >
              Clinical AI Decision Support
            </button>
          </div>

          {/* Key Metric Ticker Cards */}
          <div className="landing-metrics-grid">
            <div className="landing-metric-card" onClick={() => onEnterDashboard('Overview')}>
              <span className="metric-num">261</span>
              <span className="metric-label">Health Facilities Reporting</span>
              <small className="metric-sub">138 Public • 123 Faith-Based/Private</small>
            </div>
            <div className="landing-metric-card" onClick={() => onEnterDashboard('Data Quality')}>
              <span className="metric-num">2,998</span>
              <span className="metric-label">Active CHPs on eCHIS</span>
              <small className="metric-sub">280 Community Health Units</small>
            </div>
            <div className="landing-metric-card" onClick={() => onEnterDashboard('Disease Signals')}>
              <span className="metric-num">7</span>
              <span className="metric-label">Sub-Counties Monitored</span>
              <small className="metric-sub">Lake Victoria Basin Region</small>
            </div>
            <div className="landing-metric-card" onClick={() => onEnterDashboard('Commodity Forecast')}>
              <span className="metric-num">92.7%</span>
              <span className="metric-label">Weekly Reporting Timeliness</span>
              <small className="metric-sub">Kenya IDSR Standard Met</small>
            </div>
            <div className="landing-metric-card" onClick={() => onEnterDashboard('Data & Governance')}>
              <span className="metric-num">&lt; 24h</span>
              <span className="metric-label">Alert Verification Speed</span>
              <small className="metric-sub">Down from 72h Baseline</small>
            </div>
          </div>
        </div>
      </section>

      {/* ── LIVE STREAMING TELEMETRY TICKER ── */}
      <section className="landing-stream-section">
        <div className="landing-section-header">
          <div>
            <div className="eyebrow">Real-Time Telemetry Stream</div>
            <h3 className="section-title">Live Field Events &amp; Facility Synchronization</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="live-dot" />
            <small style={{ color: '#0b4952', fontWeight: 600 }}>
              {isLiveStreaming ? 'Streaming Live (12s refresh)' : 'Stream Paused'}
            </small>
            <button
              type="button"
              className="text-button"
              onClick={() => setIsLiveStreaming(!isLiveStreaming)}
            >
              {isLiveStreaming ? 'Pause' : 'Resume'}
            </button>
            <button
              type="button"
              className="btn-ai"
              style={{ padding: '4px 10px', fontSize: '0.74rem' }}
              onClick={() => emitSimulatedLiveEvent()}
            >
              + Trigger Telemetry Event
            </button>
          </div>
        </div>

        <div className="landing-event-stream">
          {liveEvents.slice(0, 5).map((evt) => (
            <div key={evt.id} className={`stream-item ${evt.severity}`}>
              <div className="stream-time-badge">
                <span className={`status-dot ${evt.severity === 'critical' ? 'critical' : evt.severity === 'warning' ? 'high' : 'low'}`} />
                <span>{evt.timestamp}</span>
              </div>
              <div className="stream-body">
                <div className="stream-title-row">
                  <strong>{evt.facility}</strong>
                  <span className="stream-subcounty-pill">{evt.subCounty}</span>
                  <span className="stream-category-tag">{evt.category}</span>
                </div>
                <p className="stream-msg">{evt.message}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── KISUMU SUB-COUNTIES OVERVIEW GRID ── */}
      <section className="landing-subcounties-section">
        <div className="landing-section-header">
          <div>
            <div className="eyebrow">Epidemiological Risk Heatmap</div>
            <h3 className="section-title">Kisumu County Sub-Counties (7 Surveillance Hubs)</h3>
          </div>
          <button
            type="button"
            className="secondary-button"
            onClick={() => onEnterDashboard('Disease Signals')}
          >
            Open Outbreak Tracker →
          </button>
        </div>

        <div className="landing-subcounty-cards">
          {subCounties.map((sc) => (
            <div
              key={sc.name}
              className={`landing-sc-card ${sc.level.toLowerCase()}`}
              onClick={() => onEnterDashboard('Disease Signals')}
            >
              <div className="sc-header">
                <h4>{sc.name}</h4>
                <span className={`status-pill ${sc.level.toLowerCase()}`}>{sc.level}</span>
              </div>
              <div className="sc-stat-row">
                <div>
                  <small>Alert Risk Index</small>
                  <strong>{sc.riskIndex}</strong>
                </div>
                <div>
                  <small>Facilities</small>
                  <strong>{sc.facilities}</strong>
                </div>
                <div>
                  <small>Monthly Trend</small>
                  <strong style={{ color: sc.trend.startsWith('+') ? '#d97706' : '#059669' }}>
                    {sc.trend}
                  </strong>
                </div>
              </div>
              <div className="sc-action-hint">Click to inspect sub-county signals →</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOUR CORE CAPABILITY PILLARS ── */}
      <section className="landing-pillars-section">
        <div className="landing-section-header text-center">
          <div className="eyebrow">Enterprise Health Architecture</div>
          <h3 className="section-title">Built for Frontline Clinicians, Surveillance Officers &amp; County Leadership</h3>
        </div>

        <div className="landing-pillars-grid">
          <div className="landing-pillar-card" onClick={() => onEnterDashboard('Disease Signals')}>
            <div className="pillar-icon">🦠</div>
            <h4>Automated IDSR Signal Detection</h4>
            <p>
              Continuous statistical anomaly detection flagging spikes in Malaria, Cholera, Dysentery,
              and Measles before widespread transmission occurs across Kisumu wards.
            </p>
            <span className="pillar-link">Explore Outbreak Detection →</span>
          </div>

          <div className="landing-pillar-card" onClick={onOpenCopilot}>
            <div className="pillar-icon">🧠</div>
            <h4>Groq Cloud AI Decision Support</h4>
            <p>
              Sub-second inference powered by ultra-fast LPUs and models like <code>openai/gpt-oss-120b</code>.
              Instant epidemiological summaries, clinical advisories, and triage recommendations.
            </p>
            <span className="pillar-link">Open AI Health Copilot →</span>
          </div>

          <div className="landing-pillar-card" onClick={() => onEnterDashboard('Commodity Forecast')}>
            <div className="pillar-icon">💊</div>
            <h4>Predictive Commodity Supply Chain</h4>
            <p>
              Holt-Winters and seasonal forecasting calculating 3-month consumption of essential medicines
              (AL, ORS, Zinc, Amox DT) with automated KEMSA buffer stock redistribution.
            </p>
            <span className="pillar-link">Review Supply Forecasts →</span>
          </div>

          <div className="landing-pillar-card" onClick={() => onEnterDashboard('Data & Governance')}>
            <div className="pillar-icon">🛡️</div>
            <h4>Kenya Data Protection Act Compliance</h4>
            <p>
              Fully aligned with Kenya Data Protection Act 2019 and Digital Health Act 2023.
              Strict Role-Based Access Control (RBAC), end-to-end encryption, and human-in-the-loop validation.
            </p>
            <span className="pillar-link">View Governance Register →</span>
          </div>
        </div>
      </section>

      {/* ── LIVE FACILITY DIRECTORY & TELEMETRY SEARCH ── */}
      <section className="landing-facilities-section">
        <div className="landing-section-header">
          <div>
            <div className="eyebrow">Facility Registry</div>
            <h3 className="section-title">Kisumu Health Facilities Live Status Directory</h3>
          </div>
          <div className="facility-filters">
            <input
              type="text"
              placeholder="Search facility name, level, system..."
              className="facility-search-input"
              value={facilitySearch}
              onChange={(e) => setFacilitySearch(e.target.value)}
            />
            <select
              className="facility-subcounty-select"
              value={selectedSubCountyFilter}
              onChange={(e) => setSelectedSubCountyFilter(e.target.value)}
            >
              <option value="All">All Sub-Counties</option>
              {overviewData.subCounties.map((s) => (
                <option key={s.name} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="facility-table-wrapper">
          <table className="facility-table">
            <thead>
              <tr>
                <th>Facility Name</th>
                <th>Sub-County</th>
                <th>Level</th>
                <th>Source System</th>
                <th>Active CHPs</th>
                <th>Patients (Today)</th>
                <th>Medicine Stock</th>
                <th>Sync Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredFacilities.map((fac) => (
                <tr key={fac.id}>
                  <td>
                    <strong>{fac.name}</strong>
                  </td>
                  <td>{fac.subCounty}</td>
                  <td>
                    <span className="pill neutral" style={{ color: '#0b2b3a', background: 'rgba(11,43,58,0.08)' }}>
                      {fac.level}
                    </span>
                  </td>
                  <td>
                    <code style={{ fontSize: '0.8rem', background: '#eef6f6', padding: '2px 6px', borderRadius: '4px' }}>
                      {fac.system}
                    </code>
                  </td>
                  <td>{fac.chpsActive} CHPs</td>
                  <td>
                    <strong>{fac.patientsToday}</strong>
                  </td>
                  <td>
                    <span
                      className={`status-pill ${
                        fac.stockStatus === 'Critical'
                          ? 'critical'
                          : fac.stockStatus === 'Warning'
                          ? 'moderate'
                          : 'low'
                      }`}
                    >
                      {fac.stockStatus}
                    </span>
                  </td>
                  <td>
                    <span className="sync-status-indicator">
                      <span className={`status-dot ${fac.status === 'Online' ? 'low' : 'high'}`} />
                      <small>{fac.lastSync}</small>
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="table-action-btn"
                      onClick={() => onEnterDashboard('Commodity Forecast')}
                    >
                      Inspect →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── OFFICIAL FOOTER ── */}
      <footer className="landing-footer">
        <div className="landing-footer-grid">
          <div className="footer-col brand-col">
            <div className="brand-mark">KH</div>
            <h4>County Department of Health, Kisumu</h4>
            <p>
              Prosperity House, Kisumu, Kenya • Dedicated to maternal, child, and community health
              through innovative digital surveillance and artificial intelligence.
            </p>
            <div style={{ marginTop: 12 }}>
              <span className="pill kenya">Republic of Kenya • County 042</span>
            </div>
          </div>

          <div className="footer-col">
            <h5>Surveillance Quick Links</h5>
            <ul>
              <li>
                <a href="#dashboard" onClick={() => onEnterDashboard('Overview')}>Operations Overview</a>
              </li>
              <li>
                <a href="#signals" onClick={() => onEnterDashboard('Disease Signals')}>IDSR Disease Signals</a>
              </li>
              <li>
                <a href="#forecast" onClick={() => onEnterDashboard('Commodity Forecast')}>Commodity Forecast &amp; KEMSA</a>
              </li>
              <li>
                <a href="#quality" onClick={() => onEnterDashboard('Data Quality')}>eCHIS &amp; KenyaEMR Quality</a>
              </li>
              <li>
                <a href="#governance" onClick={() => onEnterDashboard('Data & Governance')}>Kenya Data Protection Act</a>
              </li>
            </ul>
          </div>

          <div className="footer-col">
            <h5>Emergency Reporting</h5>
            <div className="emergency-card">
              <span style={{ fontSize: '1.2rem' }}>📞</span>
              <div>
                <strong>Kisumu Disease Surveillance Hotline</strong>
                <p>0800 720 000 (Toll-Free, 24/7)</p>
              </div>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#8aa6ae', marginTop: 10 }}>
              National Public Health Institute (NPHI) • Ministry of Health Kenya (Afya House)
            </p>
          </div>
        </div>

        <div className="landing-footer-bottom">
          <p>© {new Date().getFullYear()} County Government of Kisumu — Department of Health. Powered by Groq Cloud AI.</p>
          <button
            type="button"
            className="btn-ai"
            style={{ padding: '6px 14px', fontSize: '0.8rem' }}
            onClick={() => onEnterDashboard('Overview')}
          >
            Launch Full Surveillance Dashboard →
          </button>
        </div>
      </footer>
    </div>
  );
}
