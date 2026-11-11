import { useState } from 'react'
import {
  accessLog,
  dataGovernanceSummary,
  dataSources,
  governanceNotes,
  rolePermissions,
} from '../services/dataGovernanceData'
import { AnimatedCounter } from '../components/RealtimeWidgets'
import { KpiStrip, Panel, Pill } from '../components/ui'

export function GovernancePage({ lastSync }: { lastSync: string }) {
  const summary = dataGovernanceSummary
  const [showAllLog, setShowAllLog] = useState(false)
  const logRows = showAllLog ? accessLog : accessLog.slice(0, 5)
  const totalUsers = rolePermissions.reduce((sum, r) => sum + r.userCount, 0)

  return (
    <>
      <KpiStrip
        label="Governance overview"
        items={[
          {
            label: 'Compliance score',
            value: <AnimatedCounter target={summary.complianceScore} />,
            unit: '%',
            meter: { value: summary.complianceScore, tone: summary.complianceScore >= 90 ? 'ok' : 'moderate' },
            note: 'Target 90% or higher',
            detail: `Next review ${summary.nextReview}`,
          },
          {
            label: 'Connected sources',
            value: dataSources.length,
            meter: { value: 100, tone: 'ok' },
            note: 'All syncing normally',
            detail: <span className="mono">{lastSync}</span>,
          },
          {
            label: 'Active roles',
            value: rolePermissions.length,
            note: `${totalUsers} users in total`,
            detail: 'Role-based access enforced',
          },
          {
            label: 'Register entries',
            value: governanceNotes.length,
            meter: { value: summary.notesImplemented, max: governanceNotes.length, tone: 'brand' },
            note: `${summary.notesImplemented} implemented`,
            detail: `${summary.criticalGaps} critical gaps open`,
          },
          {
            label: 'Access events, 24h',
            value: accessLog.length,
            meter: { value: 100, tone: 'ok' },
            note: 'All successful',
            detail: 'No failed attempts',
          },
        ]}
      />

      <div className="grid grid-main">
        <div className="stack">
          <Panel
            eyebrow="Connected data sources"
            title="Sync status and coverage"
            flush
            aside={<span className="tag">{dataSources.length} sources</span>}
          >
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Source</th>
                    <th>Status</th>
                    <th className="r">Facilities</th>
                    <th className="r">Records, 24h</th>
                    <th>Frequency</th>
                  </tr>
                </thead>
                <tbody>
                  {dataSources.map((src) => (
                    <tr key={src.name}>
                      <th scope="row">
                        {src.name}
                        <span className="cell-sub">{src.type}</span>
                      </th>
                      <td>
                        <Pill>{src.status}</Pill>
                      </td>
                      <td className="r num">{src.facilitiesCovered}</td>
                      <td className="r num">{src.recordsSynced.toLocaleString()}</td>
                      <td>{src.syncFrequency}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel
            eyebrow="Access log"
            title="Recent access events"
            flush
            aside={
              <button type="button" className="btn btn-quiet btn-sm" onClick={() => setShowAllLog((v) => !v)}>
                {showAllLog ? 'Show fewer' : `Show all ${accessLog.length}`}
              </button>
            }
          >
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Resource</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {logRows.map((log) => (
                    <tr key={`${log.timestamp}-${log.user}`}>
                      <td className="num nowrap">{log.timestamp}</td>
                      <th scope="row">
                        {log.user}
                        <span className="cell-sub">{log.role}</span>
                      </th>
                      <td>{log.action}</td>
                      <td className="mono">{log.resource}</td>
                      <td>
                        <Pill>{log.status}</Pill>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        <Panel eyebrow="Role permissions" title="Access control matrix" flush>
          <ul className="rows">
            {rolePermissions.map((role) => (
              <li key={role.role} className="role">
                <div className="role-head">
                  <h3>{role.role}</h3>
                  <span className="tag">{role.userCount} users</span>
                </div>
                <p className="row-text">{role.description}</p>
                <ul className="permissions">
                  {role.permissions.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
                <p className="row-meta">
                  Last access <span className="mono">{role.lastAccess}</span>
                </p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel
        eyebrow="Governance register"
        title="Data protection, AI provenance and human confirmation"
        flush
        footer={
          <div className="callout">
            <h3>Critical gaps</h3>
            <p>
              MFA rollout for all roles is in progress. Data retention policy automation is planned. Target resolution
              is Q2 2027.
            </p>
          </div>
        }
      >
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Control</th>
                <th>Category</th>
                <th>Status</th>
                <th>Reference</th>
              </tr>
            </thead>
            <tbody>
              {governanceNotes.map((note) => (
                <tr key={note.id}>
                  <td className="mono">{note.id}</td>
                  <th scope="row" className="cell-text">
                    {note.title}
                    <span className="cell-sub">{note.description}</span>
                  </th>
                  <td>
                    <span className="tag">{note.category}</span>
                  </td>
                  <td>
                    <Pill>{note.status}</Pill>
                  </td>
                  <td className="cell-ref">{note.reference}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  )
}
