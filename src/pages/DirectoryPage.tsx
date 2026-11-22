import { facilities } from '../services/referralData'
import { SERVICES, SETTLEMENTS, type Referral } from '../services/referralProtocol'
import { Panel, Pill } from '../components/ui'
import type { Tone } from '../utils/tone'

const travelTone = (min: number): Tone => (min <= 10 ? 'ok' : min <= 20 ? 'moderate' : min <= 30 ? 'high' : 'critical')

export function DirectoryPage({ referrals }: { referrals: Referral[] }) {
  return (
    <>
      <Panel title="Services and capacity" eyebrow="Used to rank destinations for every referral" flush>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Facility</th>
                {SERVICES.map((s) => (
                  <th key={s} className="c">
                    {s}
                  </th>
                ))}
                <th className="r">Open slots</th>
                <th className="r">Median wait</th>
                <th className="r">Open referrals</th>
                <th>Pilot</th>
              </tr>
            </thead>
            <tbody>
              {facilities.map((f) => (
                <tr key={f.id}>
                  <th scope="row">
                    {f.name}
                    <span className="cell-sub">Level {f.level}</span>
                  </th>
                  {SERVICES.map((s) => (
                    <td key={s} className="c">
                      {f.services.includes(s) ? <span className="svc-yes" aria-label="Offered">●</span> : <span className="svc-no" aria-label="Not offered">–</span>}
                    </td>
                  ))}
                  <td className="r num">{f.slotsThisWeek || <span className="text-critical">Full</span>}</td>
                  <td className="r num">{f.medianWaitDays} days</td>
                  <td className="r num">{referrals.filter((r) => r.toFacilityId === f.id && r.status !== 'Completed').length}</td>
                  <td>
                    <Pill tone={f.activeInPilot ? 'ok' : 'neutral'}>{f.activeInPilot ? 'Active' : 'Not yet'}</Pill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel
        title="Travel time from each settlement"
        eyebrow="Minutes, typical by matatu or on foot"
        flush
        footer={
          <div className="legend">
            <span className="legend-item">
              <span className="legend-swatch tone-ok" /> 10 min or less
            </span>
            <span className="legend-item">
              <span className="legend-swatch tone-moderate" /> 11 to 20
            </span>
            <span className="legend-item">
              <span className="legend-swatch tone-high" /> 21 to 30
            </span>
            <span className="legend-item">
              <span className="legend-swatch tone-critical" /> Over 30
            </span>
            <span className="legend-note">Facility names, services, capacity and travel times are illustrative. Replace them with the county referral directory.</span>
          </div>
        }
      >
        <div className="table-wrap">
          <table className="table heat">
            <thead>
              <tr>
                <th>Settlement</th>
                {facilities.map((f) => (
                  <th key={f.id} className="c">
                    {f.short}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SETTLEMENTS.map((s) => (
                <tr key={s}>
                  <th scope="row">{s}</th>
                  {facilities.map((f) => (
                    <td key={f.id} className="c">
                      <span className={`heat-cell num tone-${travelTone(f.travel[s])}`}>{f.travel[s]}</span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  )
}
