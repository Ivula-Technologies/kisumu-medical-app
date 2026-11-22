import { useState } from 'react'
import { accessLog, controls, roleAccess } from '../services/governanceData'
import { KpiStrip, Panel, Pill } from '../components/ui'
import { formatDateTime } from '../utils/time'

export function GovernancePage() {
  const [showAllLog, setShowAllLog] = useState(false)
  const rows = showAllLog ? accessLog : accessLog.slice(0, 5)
  const count = (s: string) => controls.filter((c) => c.status === s).length

  return (
    <>
      <KpiStrip
        label="Governance summary"
        items={[
          { label: 'Controls implemented', value: `${count('Implemented')} / ${controls.length}`, meter: { value: count('Implemented'), max: controls.length, tone: 'brand' }, note: `${count('In progress')} in progress, ${count('Planned')} planned` },
          { label: 'Data Protection Impact Assessment', value: 'Planned', note: 'Required before real data is processed' },
          { label: 'Identifiers in referral records', value: 'None', note: 'Pseudonymous IDs only' },
          { label: 'Roles', value: roleAccess.length, note: `${roleAccess.reduce((s, r) => s + r.users, 0)} users in the pilot design` },
        ]}
      />

      <Panel title="Who sees what" eyebrow="Role-based access" flush>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Role</th>
                <th>Sees</th>
                <th>Can</th>
                <th>Cannot</th>
              </tr>
            </thead>
            <tbody>
              {roleAccess.map((r) => (
                <tr key={r.role}>
                  <th scope="row">
                    {r.role}
                    <span className="cell-sub">{r.users} users</span>
                  </th>
                  <td className="cell-text">{r.sees}</td>
                  <td>
                    <ul className="permissions">
                      {r.can.map((c) => (
                        <li key={c}>{c}</li>
                      ))}
                    </ul>
                  </td>
                  <td className="cell-text">{r.cannot}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Safeguards register" eyebrow="Data protection, patient safety and responsible AI" flush>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Control</th>
                <th>Area</th>
                <th>Status</th>
                <th>Reference</th>
              </tr>
            </thead>
            <tbody>
              {controls.map((c) => (
                <tr key={c.id}>
                  <td className="mono">{c.id}</td>
                  <th scope="row" className="cell-text">
                    {c.control}
                    <span className="cell-sub">{c.detail}</span>
                  </th>
                  <td>
                    <span className="tag">{c.area}</span>
                  </td>
                  <td>
                    <Pill>{c.status}</Pill>
                  </td>
                  <td className="cell-ref">{c.reference}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel
        title="Recent access"
        eyebrow="Access log"
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
                <th>Record</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={`${a.at}-${a.record}`}>
                  <td className="nowrap">{formatDateTime(a.at)}</td>
                  <th scope="row">
                    {a.user}
                    <span className="cell-sub">{a.role}</span>
                  </th>
                  <td>{a.action}</td>
                  <td className="mono">{a.record}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  )
}
