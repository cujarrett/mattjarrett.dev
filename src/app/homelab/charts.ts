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
  return nums.length === 0 ? { lo: 0, hi: 0 } : { lo: Math.min(...nums), hi: Math.max(...nums) }
}

const PAD = 3

// Where a value sits in a box `height` tall. A flat span draws through the middle.
export function yOf(v: number, { lo, hi }: Span, height = 30): number {
  return hi === lo ? height / 2 : height - PAD - ((v - lo) / (hi - lo)) * (height - 2 * PAD)
}

export interface Coord {
  x: number
  y: number
}

// One coordinate per sample in a 100-wide box, scaled from the span's low to high.
// With no span the range's own low to high is used, so a 2-point move on a quiet node still
// shows and the number beside it gives the scale. Gaps draw at the low point.
export function sparkCoords(values: (number | null)[], height = 30, span?: Span): Coord[] {
  if (values.length < 2 || values.every((v) => v === null)) return []
  const scale = span ?? spanOf(values)
  return values.map((v, i) => ({
    x: (i / (values.length - 1)) * 100,
    y: yOf(v ?? scale.lo, scale, height),
  }))
}

export function pointsOf(coords: Coord[]): string {
  return coords.map(({ x, y }) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ')
}

export function sparkPoints(values: (number | null)[], height = 30, span?: Span): string {
  return pointsOf(sparkCoords(values, height, span))
}

// Closes a sparkline down to the bottom edge, for the shaded area under it.
export function areaPoints(points: string, height = 30): string {
  return points ? `${points} 100,${height} 0,${height}` : ''
}

// Health colours for lines coloured by threshold, series colours for the rest.
export type Tone = Health | 's1' | 's2'

export interface Stop {
  offset: number
  tone: Tone
}

// Gradient stops that colour a sparkline by value, like Grafana's "from thresholds".
// Uses the same scale and padding as sparkCoords, so the colour changes where the line crosses.
export function thresholdStops(span: Span, warn: number, crit: number, height = 30): Stop[] {
  if (span.hi === span.lo) {
    const tone = health(span.lo, warn, crit)
    return [
      { offset: 0, tone },
      { offset: 1, tone },
    ]
  }
  const at = (v: number) => Math.min(1, Math.max(0, yOf(v, span, height) / height))
  const c = at(crit)
  const w = at(warn)
  return [
    { offset: 0, tone: 'crit' },
    { offset: c, tone: 'crit' },
    { offset: c, tone: 'warn' },
    { offset: w, tone: 'warn' },
    { offset: w, tone: 'good' },
    { offset: 1, tone: 'good' },
  ]
}

export interface Tick {
  left: number
  label: string
}

// Ticks sit at round local times inside the sampled window, like a Grafana x axis.
// A day of samples gets every 6 hours, a week gets every day, a month gets every Monday.
export function timeTicks(timestamps: number[]): Tick[] {
  if (timestamps.length < 2) return []
  const first = timestamps[0] * 1000
  const end = timestamps[timestamps.length - 1] * 1000
  if (end <= first) return []
  const hours = (end - first) / 3_600_000
  const d = new Date(first)
  let label: Intl.DateTimeFormatOptions
  let advance: () => void
  if (hours <= 36) {
    d.setHours(Math.floor(d.getHours() / 6) * 6, 0, 0, 0)
    label = { hour: 'numeric' }
    advance = () => d.setHours(d.getHours() + 6)
  } else if (hours <= 240) {
    d.setHours(0, 0, 0, 0)
    label = { weekday: 'short' }
    advance = () => d.setDate(d.getDate() + 1)
  } else {
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
    label = { month: 'short', day: 'numeric' }
    advance = () => d.setDate(d.getDate() + 7)
  }
  const edge = 3
  const ticks: Tick[] = []
  for (; d.getTime() <= end; advance()) {
    const left = ((d.getTime() - first) / (end - first)) * 100
    if (left >= edge && left <= 100 - edge)
      ticks.push({ left, label: d.toLocaleString('en-US', label) })
  }
  return ticks
}

// The time of one sample. Samples under an hour apart show minutes, the rest show the hour.
export function stampOf(seconds: number, stepSeconds: number): string {
  return new Date(seconds * 1000).toLocaleString(
    'en-US',
    stepSeconds < 3600
      ? { weekday: 'short', hour: 'numeric', minute: '2-digit' }
      : { month: 'short', day: 'numeric', hour: 'numeric' },
  )
}

export function interval(seconds: number): string {
  return seconds < 3600 ? `${Math.round(seconds / 60)} min` : `${Math.round(seconds / 3600)} h`
}

export interface Axis {
  span: Span
  ticks: number[]
}

// Round-number gridlines that bracket a range, like Grafana's automatic y axis.
// The step is 1, 2 or 5 times a power of ten, which keeps the labels short.
export function niceTicks(lo: number, hi: number, count = 3): Axis {
  const top = hi > lo ? hi : lo + 1
  const raw = (top - lo) / (count - 1)
  const base = 10 ** Math.floor(Math.log10(raw))
  const step = ([1, 2, 5, 10].find((s) => s * base >= raw) ?? 10) * base
  const first = Math.floor(lo / step) * step
  const last = Math.ceil(top / step) * step
  const n = Math.round((last - first) / step)
  return {
    span: { lo: first, hi: last },
    ticks: Array.from({ length: n + 1 }, (_, i) => first + i * step),
  }
}

// How far a chart has come up the screen, 0 to 1. It starts once nine tenths of the chart is on
// screen, so the long bars are already in view, and finishes with the chart centred.
export function scrollProgress(top: number, height: number, viewport: number): number {
  const start = viewport - height * 0.9
  const run = Math.max(height * 0.3, viewport * 0.5 - height * 0.4)
  return Math.min(1, Math.max(0, (start - top) / run))
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

// An axis label drops the trailing .0, so 12 MB/s and not 12.0 MB/s.
export function rateLabel(v: number): string {
  return bytesPerSecond(v).replace('.0 ', ' ')
}

// The low and high a sparkline spans, as a quiet caption under the number beside it.
export function percentRange(values: (number | null)[]): string {
  const { lo, hi } = spanOf(values)
  const [a, b] = [Math.round(lo), Math.round(hi)]
  return a === b ? `${a}%` : `${a}–${b}%`
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
