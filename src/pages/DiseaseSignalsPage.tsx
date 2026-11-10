import { useState } from 'react'
import { diseaseTrendSummary, type DiseaseSignal } from '../services/diseaseSignalsData'
import { generateLiveDiseaseAnalysis } from '../services/groqService'
import { SignalChart } from '../components/charts'
import { AiOutput, Dot, Facts, Icon, Notice, Panel, Pill } from '../components/ui'
import { toneOf } from '../utils/tone'

const STATUSES: DiseaseSignal['status'][] = ['Unverified', 'Under investigation', 'Confirmed', 'Dismissed']

interface Props {
  signals: DiseaseSignal[]
  onStatusChange: (disease: string, status: DiseaseSignal['status']) => void
  onAddNote: (disease: string, note: string) => void
  onAskCopilot: () => void
}

/** Audit entries are stored as "timestamp — text"; split them for the timeline. */
function splitAudit(entry: string): { time: string; text: string } {
  const [time, ...rest] = entry.split(' — ')
  return rest.length ? { time, text: rest.join(' — ') } : { time: '', text: entry }
}

export function DiseaseSignalsPage({ signals, onStatusChange, onAddNote, onAskCopilot }: Props) {
  const [selectedDisease, setSelectedDisease] = useState(signals[0].disease)
  const [note, setNote] = useState('')
  const [assessments, setAssessments] = useState<Record<string, string>>({})
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState('')

  const signal = signals.find((s) => s.disease === selectedDisease) ?? signals[0]
  const trend = diseaseTrendSummary.find((t) => t.disease === signal.disease) ?? diseaseTrendSummary[0]
  const weekNumber = Number.parseInt(signal.currentWeek.replace(/\D/g, ''), 10) || trend.weeklyCounts.length
  const openCount = signals.filter((s) => s.status === 'Unverified' || s.status === 'Under investigation').length

  const submitNote = () => {
    if (!note.trim()) return
    onAddNote(signal.disease, note.trim())
    setNote('')
  }

  const generateAssessment = async () => {
    setIsAnalyzing(true)
    setError('')
    try {
      const assessment = await generateLiveDiseaseAnalysis({
        disease: signal.disease,
        subCounty: signal.subCounty,
        currentWeek: signal.currentWeek,
        actual: signal.actual,
        expectedMin: signal.expectedMin,
        expectedMax: signal.expectedMax,
        zScore: signal.zScore,
        whyFlagged: signal.whyFlagged,
        status: signal.status,
      })
      setAssessments((prev) => ({ ...prev, [signal.disease]: assessment }))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <>
      <Notice>
        Signals come from a rolling baseline with a z-score threshold of 2.0, across 261 facilities. Each one needs
        verification by a surveillance officer before any response.
      </Notice>

      <div className="grid grid-master">
        <Panel
          eyebrow={signal.currentWeek}
          title="Signal queue"
          flush
          aside={<span className="tag">{openCount} open</span>}
          className="master"
        >
          <ul className="rows" role="listbox" aria-label="Disease signals">
            {signals.map((s) => (
              <li key={s.disease}>
                <button
                  type="button"
                  role="option"
                  aria-selected={s.disease === signal.disease}
                  className={s.disease === signal.disease ? 'row row-select active' : 'row row-select'}
                  onClick={() => {
                    setSelectedDisease(s.disease)
                    setError('')
                  }}
                >
                  <Dot tone={toneOf(s.level)} />
                  <span className="row-main">
                    <span className="row-title">{s.disease}</span>
                    <span className="row-meta">
                      {s.subCounty} · {s.assignedOfficer}
                    </span>
                  </span>
                  <span className="row-side">
                    <span className="row-figure num">z {s.zScore.toFixed(1)}</span>
                    <Pill>{s.status}</Pill>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Panel>

        <div className="stack">
          <Panel
            eyebrow={`${signal.subCounty} · ${signal.currentWeek}`}
            title={signal.disease}
            aside={
              <>
                <Pill tone={toneOf(signal.level)}>{`${signal.level} priority`}</Pill>
                <Pill>{signal.status}</Pill>
              </>
            }
          >
            <Facts
              items={[
                { label: 'Cases this week', value: signal.actual },
                { label: 'Expected range', value: `${signal.expectedMin}–${signal.expectedMax}` },
                { label: 'Baseline mean', value: signal.baselineMean },
                { label: 'z-score', value: signal.zScore.toFixed(1) },
              ]}
            />

            <figure className="chart-figure">
              <SignalChart
                values={trend.weeklyCounts}
                expectedMin={signal.expectedMin}
                expectedMax={signal.expectedMax}
                baseline={signal.baselineMean}
                endWeek={weekNumber}
                label={`Weekly ${signal.disease} cases in ${signal.subCounty} against the expected range`}
              />
              <figcaption className="legend">
                <span className="legend-item">
                  <span className="legend-line" /> Weekly cases
                </span>
                <span className="legend-item">
                  <span className="legend-swatch band" /> Expected range
                </span>
                <span className="legend-item">
                  <span className="legend-point above" /> Above range
                </span>
              </figcaption>
            </figure>

            <div className="callout">
              <h3>Why this was flagged</h3>
              <p>{signal.whyFlagged}</p>
            </div>

            <div className="actions">
              <button type="button" className="btn btn-primary" onClick={generateAssessment} disabled={isAnalyzing}>
                <Icon name="assistant" />
                {isAnalyzing ? 'Generating assessment…' : 'Generate AI assessment'}
              </button>
              <button type="button" className="btn" onClick={onAskCopilot}>
                Discuss with copilot
              </button>
            </div>

            {error ? (
              <p className="form-error" role="alert">
                Could not generate the assessment: {error}
              </p>
            ) : null}

            {assessments[signal.disease] ? (
              <AiOutput title={`${signal.disease}, ${signal.subCounty}`} requirement="Human confirmation required">
                {assessments[signal.disease]}
              </AiOutput>
            ) : null}
          </Panel>

          <div className="grid grid-2">
            <Panel eyebrow="Review" title="Verification workflow">
              <div className="field-row">
                <div className="field">
                  <span className="field-label">Assigned officer</span>
                  <span className="field-value">{signal.assignedOfficer}</span>
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="signal-status">
                    Workflow state
                  </label>
                  <select
                    id="signal-status"
                    className="input"
                    value={signal.status}
                    onChange={(e) => onStatusChange(signal.disease, e.target.value as DiseaseSignal['status'])}
                  >
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="field">
                <span className="field-label">Latest note</span>
                <p className="field-text">{signal.notes}</p>
              </div>
            </Panel>

            <Panel eyebrow="Audit trail" title="Review history" aside={<span className="tag">{signal.auditTrail.length} entries</span>}>
              <ol className="timeline">
                {signal.auditTrail.map((entry) => {
                  const { time, text } = splitAudit(entry)
                  return (
                    <li key={entry}>
                      {time ? <time className="mono">{time}</time> : null}
                      <p>{text}</p>
                    </li>
                  )
                })}
              </ol>
              <form
                className="inline-form"
                onSubmit={(e) => {
                  e.preventDefault()
                  submitNote()
                }}
              >
                <label className="sr-only" htmlFor="audit-note">
                  Add a verification note
                </label>
                <input
                  id="audit-note"
                  className="input"
                  type="text"
                  placeholder="Add a clinical or field verification note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
                <button type="submit" className="btn" disabled={!note.trim()}>
                  Add note
                </button>
              </form>
            </Panel>
          </div>
        </div>
      </div>
    </>
  )
}
