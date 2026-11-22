const HOUR = 3_600_000

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-KE', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

/** "5 min ago", "3 h ago", "2 days ago", or "in 4 h" for future times. */
export function relative(iso: string, now: Date): string {
  const diff = now.getTime() - new Date(iso).getTime()
  const future = diff < 0
  const abs = Math.abs(diff)
  let text: string
  if (abs < HOUR) text = `${Math.max(Math.round(abs / 60_000), 1)} min`
  else if (abs < 48 * HOUR) text = `${Math.round(abs / HOUR)} h`
  else text = `${Math.round(abs / (24 * HOUR))} days`
  return future ? `in ${text}` : `${text} ago`
}

/** Value for a datetime-local input, in local time. */
export function toLocalInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}
