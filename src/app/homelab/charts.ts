// Small pure helpers shared by the homelab sections, kept free of Angular so
// they test without a TestBed.

export type Health = 'good' | 'warn' | 'crit'

// Same thresholds as the homelab Grafana dashboards.
export function health(value: number, warn: number, crit: number): Health {
  return value >= crit ? 'crit' : value >= warn ? 'warn' : 'good'
}

export interface Span {
  lo: number
  hi: number
}

export function spanOf(...series: (number | null)[][]): Span {
  const nums = series.flat().filter((v): v is number => v !== null)
  return { lo: Math.min(...nums), hi: Math.max(...nums) }
}

// Polyline points in a 100-wide box, scaled from the range's own low to high.
// A 2-point move on a quiet node still shows, and the number beside it gives the scale.
// Gaps draw at the low point, and a flat line draws through the middle.
export function sparkPoints(values: (number | null)[], height = 30, span?: Span): string {
  if (values.length < 2 || values.every((v) => v === null)) return ''
  const { lo, hi } = span ?? spanOf(values)
  const pad = 3
  return values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * 100
      const y =
        hi === lo ? height / 2 : height - pad - (((v ?? lo) - lo) / (hi - lo)) * (height - 2 * pad)
      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')
}

export function ago(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  if (s < 5) return 'just now'
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)} min ago`
  if (s < 86_400) return `${Math.floor(s / 3600)} h ago`
  return `${Math.floor(s / 86_400)} d ago`
}

export function last(values: (number | null)[]): number {
  for (let i = values.length - 1; i >= 0; i--) {
    const v = values[i]
    if (v !== null) return v
  }
  return 0
}

export function bytesPerSecond(v: number): string {
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)} MB/s`
  if (v >= 1e3) return `${Math.round(v / 1e3)} KB/s`
  return `${Math.round(v)} B/s`
}

// Whole days from a YYYY-MM-DD date to now, counted in the reader's own days.
export function daysSince(date: string, now: Date): number {
  const [y, m, d] = date.split('-').map(Number)
  const then = new Date(y, m - 1, d)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.max(0, Math.round((today.getTime() - then.getTime()) / 86_400_000))
}

export function shortDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function gibibytes(bytes: number): number {
  return Math.round(bytes / 2 ** 30)
}
