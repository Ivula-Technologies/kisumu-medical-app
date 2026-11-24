import { settlements } from '../services/referralData'
import { linkageMetrics, type Referral } from '../services/referralProtocol'
import { RealTimeClock } from './RealtimeWidgets'
import { Icon, type IconName } from './ui'

interface LandingPageProps {
  referrals: Referral[]
  now: Date
  onEnterDashboard: (targetTab?: string) => void
  onOpenCopilot: () => void
}

const PATHWAY: Array<{ icon: IconName; title: string; text: string }> = [
  { icon: 'user', title: 'A CHP screens at home', text: 'PHQ-9, GAD-7, CAGE-AID and the ASQ suicide screen from the national guidelines, with consent.' },
  { icon: 'route', title: 'Rules set urgency and route', text: 'Urgent or routine, and the nearest facility with the right service and space.' },
  { icon: 'calendar', title: 'The facility accepts and books', text: 'Notified at once. Accepts or declines with a reason, then books a time.' },
  { icon: 'bell', title: 'Reminders and tracing', text: 'Reminders before the visit. A missed visit alerts the CHP to trace.' },
  { icon: 'check', title: 'Feedback closes the loop', text: 'The CHP hears the outcome and what to do at the next home visit.' },
]

const FEATURES: Array<{ icon: IconName; title: string; text: string; tab: string }> = [
  { icon: 'list', title: 'Structured electronic referrals', text: 'Created from the screening, so every referral carries scores, urgency, consent and a pseudonymous ID. No paper slips to lose.', tab: 'New referral' },
  { icon: 'coverage', title: 'Matched to the right facility', text: 'Ranked by the service needed, open slots, travel time from the settlement and waiting time, using the county referral directory.', tab: 'Directory' },
  { icon: 'bell', title: 'Notification and acceptance', text: 'Receiving facilities are notified straight away and must accept or decline. Referrals nobody picks up are flagged after 24 hours.', tab: 'Referrals' },
  { icon: 'calendar', title: 'Appointments, reminders and tracing', text: 'Bookings, reminders before the visit, and a tracing worklist for CHPs when someone misses an appointment.', tab: 'Follow-up' },
  { icon: 'route', title: 'Feedback to referrers', text: 'The receiving clinician sends the outcome back, so the CHP can support the person at home. Every step is logged.', tab: 'Referrals' },
  { icon: 'flag', title: 'Emergency escalation', text: 'Suicide risk, psychosis and risk of harm go straight to an on-call clinician by phone. They never wait in a queue.', tab: 'Escalations' },
]

export function LandingPage({ referrals, now, onEnterDashboard, onOpenCopilot }: LandingPageProps) {
  const m = linkageMetrics(referrals, now)
  const households = settlements.reduce((s, x) => s + x.households, 0)

  return (
    <div className="landing">
      <header className="l-header">
        <div className="l-wrap l-header-inner">
          <div className="brand">
            <span className="crest" aria-hidden="true">
              KM
            </span>
            <div>
              <p className="brand-sub">County Government of Kisumu · ACDO West Kenya</p>
              <p className="brand-name">Kisumu Mental Health Linkage</p>
            </div>
          </div>
          <div className="l-header-actions">
            <span className="powered powered-header">
              Powered by <strong>Ivula</strong>
            </span>
            <RealTimeClock />
            <button type="button" className="btn" onClick={onOpenCopilot}>
              <Icon name="assistant" size={16} />
              <span className="btn-label">Ask copilot</span>
            </button>
            <button type="button" className="btn btn-primary" onClick={() => onEnterDashboard('Overview')}>
              Open dashboard
              <Icon name="arrow" size={16} />
            </button>
          </div>
        </div>
      </header>

      <section className="l-hero">
        <div className="l-wrap l-hero-grid">
          <div className="l-hero-copy">
            <p className="eyebrow">Mental health referral and linkage to care</p>
            <h1>No one lost between screening and care</h1>
            <p className="l-lede">
              Community Health Promoters in Kisumu&apos;s informal settlements screen people with approved tools. The
              system sends each person to the right facility, tracks the referral until they are seen, and tells the CHP
              what happened. Emergencies go to a clinician by phone, never to a queue.
            </p>
            <div className="actions">
              <button type="button" className="btn btn-primary btn-lg" onClick={() => onEnterDashboard('Overview')}>
                Open the dashboard
                <Icon name="arrow" size={16} />
              </button>
              <button type="button" className="btn btn-lg" onClick={() => onEnterDashboard('New referral')}>
                Try a screening
              </button>
            </div>
          </div>

          <div className="l-pathway" aria-label="The referral pathway">
            <p className="l-pathway-title">The referral pathway</p>
            <ol>
              {PATHWAY.map((step, i) => (
                <li key={step.title}>
                  <span className="l-step-icon">
                    <Icon name={step.icon} size={18} />
                  </span>
                  <div>
                    <p className="l-step-title">
                      <span className="muted">{i + 1}.</span> {step.title}
                    </p>
                    <p className="l-step-text">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="l-branch">
              <Icon name="flag" size={16} />
              <span>
                <strong>Emergency branch.</strong> Item 9 positive or a red flag skips the queue: stay with the person and
                phone the on-call clinician.
              </span>
            </div>
          </div>
        </div>

        <div className="l-wrap">
          <dl className="l-stats">
            <div>
              <dd className="num">1 in 10</dd>
              <dt>Kenyans with a common mental disorder</dt>
              <p>Ministry of Health estimate, 2024</p>
            </div>
            <div>
              <dd className="num">75%</dd>
              <dt>Treatment gap</dt>
              <p>Ministry of Health</p>
            </div>
            <div>
              <dd className="num">0.22</dd>
              <dt>Psychiatrists per 100,000 people</dt>
              <p>WHO Mental Health Atlas 2020</p>
            </div>
            <div>
              <dd className="num">9</dd>
              <dt>Informal settlements in the pilot</dt>
              <p>About {households.toLocaleString()} households</p>
            </div>
            <div>
              <dd className="num">75%</dd>
              <dt>Target: referrals seen in time</dt>
              <p>Demo now at {m.withinTimeframe === null ? '–' : `${Math.round(m.withinTimeframe)}%`}</p>
            </div>
          </dl>
        </div>
      </section>

      <main className="l-main">
        <section className="l-wrap l-section">
          <div className="l-section-head">
            <div>
              <p className="eyebrow">Component 3 of the concept</p>
              <h2>Intelligent referral, emergency escalation and linkage to care</h2>
            </div>
            <button type="button" className="btn" onClick={() => onEnterDashboard('Referrals')}>
              See the referral queue
              <Icon name="arrow" size={16} />
            </button>
          </div>
          <div className="l-caps">
            {FEATURES.map((f) => (
              <article key={f.title} className="l-cap">
                <span className="l-cap-icon">
                  <Icon name={f.icon} size={20} />
                </span>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
                <button type="button" className="link-btn" onClick={() => onEnterDashboard(f.tab)}>
                  Open {f.tab.toLowerCase()}
                  <Icon name="arrow" size={14} />
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="l-wrap l-section">
          <div className="l-section-head">
            <div>
              <p className="eyebrow">Where the pilot runs</p>
              <h2>Nine informal settlements</h2>
            </div>
          </div>
          <div className="l-settlements">
            {settlements.map((s) => {
              const rs = referrals.filter((r) => r.settlement === s.name)
              const mm = linkageMetrics(rs, now)
              return (
                <button key={s.name} type="button" className="l-settlement" onClick={() => onEnterDashboard('Overview')}>
                  <span className="l-settlement-name">{s.name}</span>
                  <span className="l-settlement-figure num">{rs.length}</span>
                  <span className="muted">referrals</span>
                  <span className="l-settlement-meta">
                    {s.households.toLocaleString()} households · {s.communityUnits} CUs
                    {mm.withinTimeframe !== null ? ` · ${Math.round(mm.withinTimeframe)}% seen in time` : ''}
                  </span>
                </button>
              )
            })}
          </div>
          <p className="l-caption">Synthetic demo data. Household and community unit figures are illustrative.</p>
        </section>
      </main>

      <footer className="l-footer">
        <div className="l-wrap l-footer-grid">
          <div>
            <div className="brand">
              <span className="crest" aria-hidden="true">
                KM
              </span>
              <p className="brand-name">Kisumu Mental Health Linkage</p>
            </div>
            <p className="l-footer-text">
              A pilot of the Adventist Community Development Organization, West Kenya, with the Kisumu County Department of
              Health. It builds on eCHIS, KenyaEMR and KHIS. It does not diagnose: health workers decide.
            </p>
            <p className="powered powered-lg">
              Powered by <strong>Ivula Technologies</strong>
            </p>
          </div>

          <nav aria-label="Dashboard sections">
            <p className="nav-label">Dashboard</p>
            <ul className="l-links">
              {['Overview', 'Escalations', 'New referral', 'Referrals', 'Follow-up', 'Directory', 'Pilot M&E', 'Data & Governance'].map((tab) => (
                <li key={tab}>
                  <button type="button" onClick={() => onEnterDashboard(tab)}>
                    {tab}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="nav-label">In a mental health emergency</p>
            <div className="l-hotline">
              <Icon name="phone" size={20} />
              <div>
                <p>If someone is in immediate danger, call</p>
                <p className="l-hotline-number num">999 or 112</p>
                <p className="l-hotline-note">County crisis line: to be confirmed</p>
              </div>
            </div>
          </div>
        </div>
        <div className="l-wrap l-footer-base">
          <p>© {now.getFullYear()} County Government of Kisumu and ACDO West Kenya. Powered by Ivula Technologies.</p>
          <p>Synthetic demo data. No real person is shown.</p>
        </div>
      </footer>
    </div>
  )
}
