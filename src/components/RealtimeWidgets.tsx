import { useEffect, useState } from 'react';

// Real-time clock with Kisumu timezone (EAT = UTC+3)
export function RealTimeClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatted = time.toLocaleString('en-KE', {
    timeZone: 'Africa/Nairobi',
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  return <span className="realtime-clock">{formatted} EAT</span>;
}

// Animated counter that counts up to a target value
interface AnimatedCounterProps {
  target: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  decimals?: number;
}

export function AnimatedCounter({ target, suffix = '', prefix = '', duration = 1200, decimals = 0 }: AnimatedCounterProps) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(parseFloat((eased * target).toFixed(decimals)));
      if (progress < 1) requestAnimationFrame(animate);
    };
    const raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, decimals]);

  return (
    <span className="animated-counter">
      {prefix}{decimals > 0 ? current.toFixed(decimals) : Math.floor(current).toLocaleString()}{suffix}
    </span>
  );
}

// Status badge with color
interface StatusBadgeProps {
  status: 'online' | 'syncing' | 'offline' | 'warning';
  label: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  return (
    <span className={`status-badge status-badge-${status}`}>
      <span className="status-badge-dot" />
      {label}
    </span>
  );
}

// Kisumu-specific system status indicator
export function SystemStatusBar() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const sources = [
    { name: 'eCHIS', status: 'online' as const },
    { name: 'KenyaEMR', status: 'online' as const },
    { name: 'KHIS', status: 'syncing' as const },
    { name: 'Groq Cloud AI', status: 'online' as const },
  ];

  return (
    <div className="system-status-bar">
      {sources.map((src) => (
        <StatusBadge key={`${src.name}-${tick}`} status={src.status} label={src.name} />
      ))}
    </div>
  );
}

// Auto-refreshing "last synced" live display
export function LiveSyncIndicator({ baseTime }: { baseTime: string }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setElapsed((e) => e + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  const label = elapsed === 0 ? baseTime : `${baseTime} (${elapsed}m ago)`;
  return (
    <span className="live-sync-indicator">
      <span className="live-dot" />
      {label}
    </span>
  );
}

// Progress bar for metrics
interface MetricProgressBarProps {
  value: number;
  max?: number;
  color?: 'teal' | 'green' | 'amber' | 'red';
}

export function MetricProgressBar({ value, max = 100, color = 'teal' }: MetricProgressBarProps) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="metric-progress-bar-track">
      <div
        className={`metric-progress-bar-fill metric-bar-${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
