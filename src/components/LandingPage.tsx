import { useState, useEffect } from 'react';
import { RealTimeClock } from './RealtimeWidgets';
import { Dot, Icon, Pill, type IconName } from './ui';
import { toneOf } from '../utils/tone';
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

  const stats: Array<{ value: string; label: string; sub: string; tab: string }> = [
    { value: '261', label: 'Health facilities', sub: '138 government-owned', tab: 'Overview' },
    { value: '2,998', label: 'Community health promoters', sub: '280 community units, 307,185 households', tab: 'Data Quality' },
    { value: '7', label: 'Sub-counties monitored', sub: 'Lake Victoria basin', tab: 'Disease Signals' },
    { value: '92.7%', label: 'Facilities reporting weekly', sub: '242 of 261 this week', tab: 'Data Quality' },
    { value: '4.2 h', label: 'Median alert verification', sub: 'Down from 18.5 h at baseline', tab: 'Pilot M&E' },
  ];

  const capabilities: Array<{ icon: IconName; title: string; text: string; link: string; action: () => void }> = [
    {
      icon: 'signals',
      title: 'Disease signal detection',
      text: 'A rolling baseline with a z-score flags unusual weekly counts of malaria, diarrhoeal disease, respiratory infection, suspected measles and suspected cholera for officers to verify.',
      link: 'Open disease signals',
      action: () => onEnterDashboard('Disease Signals'),
    },
    {
      icon: 'commodity',
      title: 'Commodity forecasting',
      text: 'Seasonal and Holt-Winters models forecast three months of demand for AL, amoxicillin DT, ORS, zinc and malaria RDTs, and suggest redistribution for a pharmacist to approve.',
      link: 'Review supply forecasts',
      action: () => onEnterDashboard('Commodity Forecast'),
    },
    {
      icon: 'coverage',
      title: 'Service coverage gaps',
      text: 'Household visits, antenatal care, skilled delivery and immunisation are compared with targets to show which community units are being missed, so outreach goes where it is needed.',
      link: 'See coverage gaps',
      action: () => onEnterDashboard('Service Coverage'),
    },
    {
      icon: 'assistant',
      title: 'AI decision support',
      text: 'A copilot summarises what the numbers show in plain language and drafts advisories. Every output is labelled, logged and held for human confirmation.',
      link: 'Ask the copilot',
      action: onOpenCopilot,
    },
    {
      icon: 'governance',
      title: 'Data protection by design',
      text: 'Aggregated data only, role-based access and a full access log. The design is shaped by the Data Protection Act (2019) and the Digital Health Act (2023).',
      link: 'View the governance register',
      action: () => onEnterDashboard('Data & Governance'),
    },
  ];

  const eventTone = (severity: LiveHealthEvent['severity']) =>
    severity === 'critical' ? 'critical' : severity === 'warning' ? 'high' : severity === 'info' ? 'info' : 'ok';

  return (
    <div className="landing">
      <header className="l-header">
        <div className="l-wrap l-header-inner">
          <div className="brand">
            <span className="crest" aria-hidden="true">
              KH
            </span>
            <div>
              <p className="brand-sub">Republic of Kenya · County Government of Kisumu</p>
              <p className="brand-name">Department of Health · Health Intelligence</p>
            </div>
          </div>
          <div className="l-header-actions">
            <RealTimeClock />
            <button type="button" className="btn btn-on-dark" onClick={onOpenCopilot}>
              <Icon name="assistant" size={16} />
              <span className="btn-label">Ask copilot</span>
            </button>
            <button type="button" className="btn btn-accent" onClick={() => onEnterDashboard('Overview')}>
              Open dashboard
              <Icon name="arrow" size={16} />
            </button>
          </div>
        </div>
      </header>

      <section className="l-hero">
        <div className="l-wrap l-hero-grid">
          <div className="l-hero-copy">
            <p className="eyebrow">Integrated Disease Surveillance and Response · Epi week 42</p>
            <h1>Earlier action and better resource allocation for Kisumu County</h1>
            <p className="l-lede">
              Community and facility data already held in eCHIS, KenyaEMR and KHIS become weekly disease signals,
              medicine supply forecasts and service coverage gaps for all 7 sub-counties. Officers verify every alert before anyone acts
              on it.
            </p>
            <div className="actions">
              <button type="button" className="btn btn-accent btn-lg" onClick={() => onEnterDashboard('Overview')}>
                Open operations dashboard
                <Icon name="arrow" size={16} />
              </button>
              <button type="button" className="btn btn-on-dark btn-lg" onClick={() => onEnterDashboard('Disease Signals')}>
                View disease signals
              </button>
            </div>
          </div>

          <div className="l-feed" aria-label="Live field events">
            <div className="l-feed-head">
              <p className="l-feed-title">
                <span className={isLiveStreaming ? 'dot dot-ok pulse' : 'dot dot-neutral'} aria-hidden="true" />
                {isLiveStreaming ? 'Live field events' : 'Feed paused'}
              </p>
              <div className="l-feed-tools">
                <button
                  type="button"
                  className="icon-btn on-dark"
                  onClick={() => setIsLiveStreaming(!isLiveStreaming)}
                  aria-label={isLiveStreaming ? 'Pause feed' : 'Resume feed'}
                  title={isLiveStreaming ? 'Pause feed' : 'Resume feed'}
                >
                  <Icon name={isLiveStreaming ? 'pause' : 'play'} size={16} />
                </button>
                <button
                  type="button"
                  className="icon-btn on-dark"
                  onClick={() => emitSimulatedLiveEvent()}
                  aria-label="Simulate an event"
                  title="Simulate an event"
                >
                  <Icon name="plus" size={16} />
                </button>
              </div>
            </div>
            <ul className="l-feed-list">
              {liveEvents.slice(0, 5).map((evt) => (
                <li key={evt.id}>
                  <Dot tone={eventTone(evt.severity)} />
                  <div>
                    <p className="l-feed-line">
                      <strong>{evt.facility}</strong>
                      <span>{evt.subCounty}</span>
                    </p>
                    <p className="l-feed-msg">{evt.message}</p>
                  </div>
                  <time className="mono">{evt.timestamp}</time>
                </li>
              ))}
            </ul>
            <p className="l-feed-foot">Simulated telemetry from synthetic demo data.</p>
          </div>
        </div>

        <div className="l-wrap">
          <dl className="l-stats">
            {stats.map((stat) => (
              <div key={stat.label}>
                <dd className="num">{stat.value}</dd>
                <dt>{stat.label}</dt>
                <p>{stat.sub}</p>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <main className="l-main">
        <section className="l-wrap l-section">
          <div className="l-section-head">
            <div>
              <p className="eyebrow">Sub-county risk</p>
              <h2>Alert intensity across the county</h2>
            </div>
            <button type="button" className="btn" onClick={() => onEnterDashboard('Disease Signals')}>
              Open disease signals
              <Icon name="arrow" size={16} />
            </button>
          </div>
          <div className="l-counties">
            {overviewData.subCounties.map((sc) => (
              <button
                key={sc.name}
                type="button"
                className={`map-tile tone-${toneOf(sc.alertLevel)}`}
                onClick={() => onEnterDashboard('Disease Signals')}
                title={`Open disease signals — ${sc.name}`}
              >
                <span className="map-tile-name">{sc.name}</span>
                <span className="map-tile-index num">{sc.riskIndex}</span>
                <span className="map-tile-meta">
                  <span className="map-tile-level">{sc.alertLevel}</span>
                  <span className="num">{sc.trend}</span>
                </span>
                <span className="map-tile-sub">{sc.facilities} facilities</span>
              </button>
            ))}
          </div>
          <p className="l-caption">Risk index 0–100 from weekly IDSR thresholds. Trend compares with the prior month.</p>
        </section>

        <section className="l-wrap l-section">
          <div className="l-section-head">
            <div>
              <p className="eyebrow">What the platform does</p>
              <h2>Analytics that leave the decisions with people</h2>
            </div>
          </div>
          <div className="l-caps">
            {capabilities.map((cap) => (
              <article key={cap.title} className="l-cap">
                <span className="l-cap-icon">
                  <Icon name={cap.icon} size={20} />
                </span>
                <h3>{cap.title}</h3>
                <p>{cap.text}</p>
                <button type="button" className="link-btn" onClick={cap.action}>
                  {cap.link}
                  <Icon name="arrow" size={14} />
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="l-wrap l-section">
          <div className="l-section-head">
            <div>
              <p className="eyebrow">Facility registry</p>
              <h2>Facility status directory</h2>
            </div>
            <div className="filters">
              <label className="search">
                <span className="sr-only">Search facilities</span>
                <Icon name="search" size={16} />
                <input
                  id="facility-search"
                  type="search"
                  placeholder="Search facility, sub-county or system"
                  value={facilitySearch}
                  onChange={(e) => setFacilitySearch(e.target.value)}
                />
              </label>
              <label>
                <span className="sr-only">Filter by sub-county</span>
                <select
                  id="facility-subcounty"
                  className="input"
                  value={selectedSubCountyFilter}
                  onChange={(e) => setSelectedSubCountyFilter(e.target.value)}
                >
                  <option value="All">All sub-counties</option>
                  {overviewData.subCounties.map((s) => (
                    <option key={s.name} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="panel">
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Facility</th>
                    <th>Level</th>
                    <th>Source</th>
                    <th className="r">Active CHPs</th>
                    <th className="r">Patients today</th>
                    <th>Medicine stock</th>
                    <th>Last sync</th>
                    <th>
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFacilities.map((fac) => (
                    <tr key={fac.id}>
                      <th scope="row" className="cell-text">
                        {fac.name}
                        <span className="cell-sub">{fac.subCounty}</span>
                      </th>
                      <td className="nowrap">{fac.level}</td>
                      <td>
                        <span className="tag">{fac.system}</span>
                      </td>
                      <td className="r num">{fac.chpsActive}</td>
                      <td className="r num">{fac.patientsToday}</td>
                      <td>
                        <Pill>{fac.stockStatus}</Pill>
                      </td>
                      <td className="nowrap">
                        <span className="inline-status">
                          <Dot tone={toneOf(fac.status)} />
                          {fac.lastSync}
                        </span>
                      </td>
                      <td className="r">
                        <button type="button" className="link-btn" onClick={() => onEnterDashboard('Commodity Forecast')}>
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredFacilities.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="empty">
                        No facilities match that search. Clear the search or choose another sub-county.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
          <p className="l-caption">
            Showing {filteredFacilities.length} of {KISUMU_FACILITIES.length} facilities in the demo registry.
          </p>
        </section>
      </main>

      <footer className="l-footer">
        <div className="l-wrap l-footer-grid">
          <div>
            <div className="brand">
              <span className="crest" aria-hidden="true">
                KH
              </span>
              <p className="brand-name">County Department of Health, Kisumu</p>
            </div>
            <p className="l-footer-text">
              Prosperity House, Kisumu. A decision-support prototype that builds on eCHIS, KenyaEMR and KHIS rather
              than replacing them.
            </p>
          </div>

          <nav aria-label="Dashboard sections">
            <p className="nav-label">Dashboard</p>
            <ul className="l-links">
              {['Overview', 'Disease Signals', 'Commodity Forecast', 'Service Coverage', 'Data Quality', 'Pilot M&E', 'Data & Governance'].map((tab) => (
                <li key={tab}>
                  <button type="button" onClick={() => onEnterDashboard(tab)}>
                    {tab}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="nav-label">Report an outbreak</p>
            <div className="l-hotline">
              <Icon name="phone" size={20} />
              <div>
                <p>Disease surveillance hotline</p>
                <p className="l-hotline-number num">0800 720 000</p>
                <p className="l-hotline-note">Toll-free, 24 hours</p>
              </div>
            </div>
          </div>
        </div>
        <div className="l-wrap l-footer-base">
          <p>© {new Date().getFullYear()} County Government of Kisumu, Department of Health.</p>
          <p>Synthetic demo data. Aggregated figures only.</p>
        </div>
      </footer>
    </div>
  );
}
