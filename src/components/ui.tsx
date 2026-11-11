import type { ReactNode } from 'react'
import { toneOf, type Tone } from '../utils/tone'

/* ── Icons ────────────────────────────────────────────────────────
   Single-weight line icons on a 20px grid. */

const ICONS = {
  overview: 'M3 3h6v8H3zM11 3h6v5h-6zM11 10h6v7h-6zM3 13h6v4H3z',
  signals: 'M2 10h3.5l2-6 4 12 2.5-6H18',
  commodity: 'M3 6.5 10 3l7 3.5v7L10 17l-7-3.5zM3 6.5 10 10l7-3.5M10 10v7',
  coverage: 'M10 17.5s5.5-4.9 5.5-9.3a5.5 5.5 0 0 0-11 0c0 4.4 5.5 9.3 5.5 9.3zM10 6.2a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',
  quality: 'M10 2.5a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15zM6.5 10.2l2.4 2.4 4.6-5',
  pilot: 'M3 16V4M3 16h14M6 12.5l3.2-3.5 2.6 2.2L16 6M16 6h-3M16 6v3',
  governance: 'M10 2.5 16 5v4.6c0 3.6-2.4 6.4-6 7.9-3.6-1.5-6-4.3-6-7.9V5zM7.2 10l2 2 3.6-4',
  menu: 'M3 5.5h14M3 10h14M3 14.5h14',
  close: 'M5 5l10 10M15 5 5 15',
  sync: 'M16.5 10a6.5 6.5 0 0 1-11.6 4M3.5 10a6.5 6.5 0 0 1 11.6-4M15.5 2.8V6h-3.2M4.5 17.2V14h3.2',
  download: 'M10 3v9.5M6.2 9l3.8 3.8L13.8 9M3.5 16.5h13',
  assistant: 'M4 4.5h12v8.8H9.6L6 16.5v-3.2H4zM7.4 8h5.2M7.4 10.4h3.4',
  settings: 'M3 6h8M14.5 6H17M3 14h2.5M9 14h8M12.8 4.2v3.6M7.2 12.2v3.6',
  arrow: 'M4 10h12M11.5 5.5 16 10l-4.5 4.5',
  search: 'M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11zM13 13l4 4',
  phone: 'M5.2 3h2.6l1.2 3.4-1.7 1.2a9 9 0 0 0 5.1 5.1l1.2-1.7L17 12.2v2.6A2.2 2.2 0 0 1 14.8 17C8.3 17 3 11.7 3 5.2A2.2 2.2 0 0 1 5.2 3z',
  info: 'M10 2.5a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15zM10 9.2v4.3M10 6.4v.4',
  send: 'M3.5 10 16.5 3.8 13 16.5l-2.8-5zM10.2 11.5 16.5 3.8',
  plus: 'M10 4v12M4 10h12',
  pause: 'M7 4.5v11M13 4.5v11',
  play: 'M6.5 4.5v11l9-5.5z',
  home: 'M3.5 9.5 10 3.5l6.5 6V16.5h-4.4v-4.2H7.9v4.2H3.5z',
  check: 'M4.5 10.5 8.5 14.5 15.5 6',
  chevron: 'M5.5 8 10 12.5 14.5 8',
  flag: 'M5 17V3.5M5 4.2h9.5L12.6 7.6l1.9 3.4H5',
} as const

export type IconName = keyof typeof ICONS

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={ICONS[name]} />
    </svg>
  )
}

/* ── Primitives ──────────────────────────────────────────────────── */

export function Pill({ children, tone }: { children: string; tone?: Tone }) {
  return <span className={`pill pill-${tone ?? toneOf(children)}`}>{children}</span>
}

export function Dot({ tone }: { tone: Tone }) {
  return <span className={`dot dot-${tone}`} aria-hidden="true" />
}

export function Meter({ value, max = 100, tone = 'neutral' }: { value: number; max?: number; tone?: Tone | 'brand' }) {
  const pct = Math.max(0, Math.min((value / max) * 100, 100))
  return (
    <div className="meter" role="presentation">
      <div className={`meter-fill meter-${tone}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

interface PanelProps {
  title: string
  eyebrow?: string
  aside?: ReactNode
  footer?: ReactNode
  flush?: boolean
  className?: string
  children: ReactNode
}

/** A titled surface. `flush` removes body padding for tables and lists that run edge to edge. */
export function Panel({ title, eyebrow, aside, footer, flush, className, children }: PanelProps) {
  return (
    <section className={`panel${className ? ` ${className}` : ''}`}>
      <header className="panel-head">
        <div className="panel-titles">
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h2>{title}</h2>
        </div>
        {aside ? <div className="panel-aside">{aside}</div> : null}
      </header>
      <div className={flush ? 'panel-body flush' : 'panel-body'}>{children}</div>
      {footer ? <footer className="panel-foot">{footer}</footer> : null}
    </section>
  )
}

export interface KpiItem {
  label: string
  value: ReactNode
  unit?: string
  note?: string
  detail?: ReactNode
  meter?: { value: number; max?: number; tone?: Tone | 'brand' }
}

/** Headline figures in one ruled strip rather than a row of separate cards. */
export function KpiStrip({ items, label }: { items: KpiItem[]; label: string }) {
  return (
    <section className="kpi-strip" aria-label={label}>
      {items.map((item) => (
        <div key={item.label} className="kpi">
          <p className="kpi-label">{item.label}</p>
          <p className="kpi-value num">
            {item.value}
            {item.unit ? <span className="kpi-unit">{item.unit}</span> : null}
          </p>
          {item.meter ? <Meter {...item.meter} /> : null}
          {item.note ? <p className="kpi-note">{item.note}</p> : null}
          {item.detail ? <p className="kpi-detail">{item.detail}</p> : null}
        </div>
      ))}
    </section>
  )
}

/** Quiet inline notice — used for the standing "AI supports, humans decide" reminders. */
export function Notice({ children }: { children: ReactNode }) {
  return (
    <p className="notice" role="note">
      <Icon name="info" size={16} />
      <span>{children}</span>
    </p>
  )
}

export function Facts({ items }: { items: Array<{ label: string; value: ReactNode }> }) {
  return (
    <dl className="facts">
      {items.map((item) => (
        <div key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}

/** AI-generated text block: always labelled, always carries the sign-off requirement. */
export function AiOutput({ title, requirement, children }: { title: string; requirement: string; children: ReactNode }) {
  return (
    <div className="ai-output">
      <div className="ai-output-head">
        <span className="ai-tag">AI-generated</span>
        <strong>{title}</strong>
        <span className="ai-output-req">{requirement}</span>
      </div>
      <div className="ai-output-body">{children}</div>
    </div>
  )
}
