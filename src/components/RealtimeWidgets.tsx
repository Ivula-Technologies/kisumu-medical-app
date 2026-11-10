import { useEffect, useState } from 'react'

/** Live clock in East Africa Time (UTC+3). */
export function RealTimeClock() {
  const [time, setTime] = useState(() => new Date())

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  const formatted = time.toLocaleString('en-KE', {
    timeZone: 'Africa/Nairobi',
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })

  return <span className="clock">{formatted} EAT</span>
}

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

interface AnimatedCounterProps {
  target: number
  duration?: number
  decimals?: number
}

/** Counts up to the target once on mount. Respects reduced-motion. */
export function AnimatedCounter({ target, duration = 900, decimals = 0 }: AnimatedCounterProps) {
  const [current, setCurrent] = useState(() => (prefersReducedMotion() ? target : 0))

  useEffect(() => {
    if (prefersReducedMotion()) return
    const start = performance.now()
    let raf = 0
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCurrent(progress < 1 ? eased * target : target)
      if (progress < 1) raf = requestAnimationFrame(animate)
    }
    raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])

  return <>{decimals > 0 ? current.toFixed(decimals) : Math.floor(current).toLocaleString()}</>
}

const SOURCES = [
  { name: 'eCHIS', status: 'Online' },
  { name: 'KenyaEMR', status: 'Online' },
  { name: 'KHIS', status: 'Syncing' },
  { name: 'Groq Cloud AI', status: 'Online' },
] as const

/** Connection state of each upstream system. */
export function SourceStatusList() {
  return (
    <ul className="sources">
      {SOURCES.map((src) => (
        <li key={src.name}>
          <span className={src.status === 'Syncing' ? 'dot dot-info pulse' : 'dot dot-ok'} aria-hidden="true" />
          <span>{src.name}</span>
          <span className="sources-state">{src.status}</span>
        </li>
      ))}
    </ul>
  )
}
