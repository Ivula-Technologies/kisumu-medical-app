import { useState } from 'react'
import { commodityForecasts, commoditySummary, subCountyStock } from '../services/commodityForecastData'
import { generateSupplyOptimization } from '../services/groqService'
import { AiOutput, Facts, Icon, KpiStrip, Panel, Pill } from '../components/ui'
import { toneOf, type Tone } from '../utils/tone'

export type ApprovalStatus = 'Pending' | 'Approved' | 'Escalated'

interface Props {
  approvals: Record<string, ApprovalStatus>
  onApprovalChange: (commodity: string, status: ApprovalStatus) => void
  onAskCopilot: () => void
  lastSync: string
}

/** Months of stock: under 2 is critical, under 3 needs attention. */
function stockTone(months: number): Tone {
  if (months < 2) return 'critical'
  if (months < 3) return 'moderate'
  return 'ok'
}

const commodities = commodityForecasts.map((f) => f.commodity)
const subCounties = [...new Set(subCountyStock.map((s) => s.subCounty))]

export function CommodityForecastPage({ approvals, onApprovalChange, onAskCopilot, lastSync }: Props) {
  const [plan, setPlan] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState('')

  const generatePlan = async () => {
    setIsAnalyzing(true)
    setError('')
    try {
      const al = commodityForecasts.find((c) => c.commodity === 'AL') ?? commodityForecasts[0]
      setPlan(await generateSupplyOptimization(al))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <>
      <KpiStrip
        label="Months of stock by commodity"
        items={commodityForecasts.map((item) => ({
          label: item.commodity,
          value: item.monthsOfStock.toFixed(1),
          unit: 'months',
          meter: { value: item.monthsOfStock, max: 6, tone: stockTone(item.monthsOfStock) },
          note: `${item.stockOnHand.toLocaleString()} ${item.unit}`,
          detail: (
            <>
              <Pill>{item.riskStatus}</Pill> {item.facilitiesAtRisk} facilities at risk
            </>
          ),
        }))}
      />

      <Panel
        eyebrow="County-level forecast"
        title="3-month demand against stock"
        flush
        aside={<span className="tag">{commoditySummary.dataSource}</span>}
        footer={
          <>
            <div className="actions">
              <button type="button" className="btn btn-primary" onClick={generatePlan} disabled={isAnalyzing}>
                <Icon name="assistant" />
                {isAnalyzing ? 'Drafting plan…' : 'Draft AI redistribution plan'}
              </button>
              <button type="button" className="btn" onClick={onAskCopilot}>
                Discuss stockouts with copilot
              </button>
            </div>
            {error ? (
              <p className="form-error" role="alert">
                Could not draft the plan: {error}
              </p>
            ) : null}
            {plan ? (
              <AiOutput title="Supply redistribution brief — AL" requirement="Requires County Pharmacist approval">
                {plan}
              </AiOutput>
            ) : null}
          </>
        }
      >
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Commodity</th>
                <th className="r">Stock on hand</th>
                <th className="r">Monthly use</th>
                <th className="r">3-month forecast</th>
                <th className="r">Confidence band</th>
                <th className="r">Months of stock</th>
                <th>Risk</th>
              </tr>
            </thead>
            <tbody>
              {commodityForecasts.map((item) => (
                <tr key={item.commodity}>
                  <th scope="row">
                    {item.commodity}
                    <span className="cell-sub">{item.unit}</span>
                  </th>
                  <td className="r num">{item.stockOnHand.toLocaleString()}</td>
                  <td className="r num">{item.monthlyConsumption.toLocaleString()}</td>
                  <td className="r num">{item.forecast3Month.toLocaleString()}</td>
                  <td className="r num">
                    {item.confidenceBand.min.toLocaleString()}–{item.confidenceBand.max.toLocaleString()}
                  </td>
                  <td className="r num">{item.monthsOfStock.toFixed(1)}</td>
                  <td>
                    <Pill>{item.riskStatus}</Pill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid grid-2">
        <Panel
          eyebrow="Approval queue"
          title="Redistribution suggestions"
          flush
          aside={<span className="tag">Human approval required</span>}
        >
          <ul className="rows">
            {commodityForecasts.map((f) => {
              const status = approvals[f.commodity] ?? 'Pending'
              return (
                <li key={f.commodity} className="row row-wrap">
                  <div className="row-main">
                    <p className="row-title">{f.commodity}</p>
                    <p className="row-text">{f.redistributionSuggestion}</p>
                  </div>
                  <div className="row-actions">
                    <Pill>{status}</Pill>
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={() => onApprovalChange(f.commodity, 'Approved')}
                      disabled={status === 'Approved'}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-quiet"
                      onClick={() => onApprovalChange(f.commodity, 'Escalated')}
                      disabled={status === 'Escalated'}
                    >
                      Escalate to KEMSA
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        </Panel>

        <Panel
          eyebrow="Sub-county stock"
          title="Months of stock by area"
          flush
          footer={
            <div className="legend">
              <span className="legend-item">
                <span className="legend-swatch tone-critical" /> Under 2 months
              </span>
              <span className="legend-item">
                <span className="legend-swatch tone-moderate" /> 2 to 3
              </span>
              <span className="legend-item">
                <span className="legend-swatch tone-ok" /> 3 or more
              </span>
            </div>
          }
        >
          <div className="table-wrap">
            <table className="table heat">
              <thead>
                <tr>
                  <th>Sub-county</th>
                  {commodities.map((c) => (
                    <th key={c} className="c">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {subCounties.map((sc) => (
                  <tr key={sc}>
                    <th scope="row">{sc}</th>
                    {commodities.map((c) => {
                      const cell = subCountyStock.find((s) => s.subCounty === sc && s.commodity === c)
                      return cell ? (
                        <td key={c} className="c">
                          <span
                            className={`heat-cell num tone-${stockTone(cell.monthsOfStock)}`}
                            title={`${cell.stockOnHand.toLocaleString()} units · ${cell.riskStatus} risk`}
                          >
                            {cell.monthsOfStock.toFixed(1)}
                          </span>
                        </td>
                      ) : (
                        <td key={c} className="c muted">
                          –
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      <div className="grid grid-2">
        <Panel eyebrow="Forecast methodology" title="How forecasts are generated">
          <ul className="checklist">
            <li>Seasonal naive baseline with 52-week seasonality for stable commodities (AL, ORS, Zinc).</li>
            <li>Holt-Winters additive model for commodities with trend (Amoxicillin DT, Malaria RDT).</li>
            <li>Confidence bands: ±10% for stable, ±15% for trending commodities.</li>
            <li>Forecasts updated weekly after KenyaEMR and eLMIS sync.</li>
          </ul>
        </Panel>

        <Panel eyebrow="Data coverage" title="Reporting status">
          <Facts
            items={[
              { label: 'Facilities in county', value: commoditySummary.totalFacilities },
              { label: 'Reporting this cycle', value: commoditySummary.facilitiesReporting },
              { label: 'Overall risk level', value: <Pill tone={toneOf(commoditySummary.overallRisk)}>{commoditySummary.overallRisk}</Pill> },
              { label: 'Last sync', value: <span className="facts-small">{lastSync}</span> },
            ]}
          />
        </Panel>
      </div>
    </>
  )
}
