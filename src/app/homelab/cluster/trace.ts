import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core'
import {
  Span,
  Tick,
  Tone,
  areaPoints,
  health,
  pointsOf,
  sparkCoords,
  spanOf,
  thresholdStops,
  yOf,
} from '../charts'

export interface Line {
  values: (number | null)[]
  tone?: 's1' | 's2'
}

export interface Limits {
  warn: number
  crit: number
}

export interface YTick {
  value: number
  label: string
}

const HEIGHT = 44
let nextId = 0

// One time series: shaded line, faint grid, a dot on the latest sample, and a crosshair that
// every trace on the page shares through the cursor index.
@Component({
  selector: 'app-trace',
  templateUrl: './trace.html',
  styleUrl: './trace.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Trace {
  readonly lines = input.required<Line[]>()
  // Colours the line by health. Without it each line keeps its own series colour.
  readonly limits = input<Limits | null>(null)
  // Pairs share one scale so they compare honestly. Without it the line uses its own low to high.
  readonly span = input<Span | null>(null)
  readonly ticks = input<Tick[]>([])
  readonly yTicks = input<YTick[]>([])
  // Sample index under the pointer, shared across traces. Null when nothing is hovered.
  readonly cursor = input<number | null>(null)
  readonly stamp = input('')
  readonly scrub = output<number | null>()

  protected readonly height = HEIGHT
  protected readonly active = signal(false)
  private readonly uid = `trace-${nextId++}`

  private readonly scale = computed(
    () => this.span() ?? spanOf(...this.lines().map((l) => l.values)),
  )

  protected readonly layers = computed(() => {
    const scale = this.scale()
    const limits = this.limits()
    return this.lines().map((line, i) => {
      const coords = sparkCoords(line.values, HEIGHT, scale)
      const points = pointsOf(coords)
      const tones: Tone[] = line.values.map((v) =>
        limits && v !== null ? health(v, limits.warn, limits.crit) : (line.tone ?? 's1'),
      )
      const ys = coords.map((c, k) => (line.values[k] === null ? null : (c.y / HEIGHT) * 100))
      let latest = -1
      line.values.forEach((v, k) => {
        if (v !== null) latest = k
      })
      return {
        id: `${this.uid}-${i}`,
        points,
        area: areaPoints(points, HEIGHT),
        stops: limits
          ? thresholdStops(scale, limits.warn, limits.crit, HEIGHT)
          : [
              { offset: 0, tone: line.tone ?? 's1' },
              { offset: 1, tone: line.tone ?? 's1' },
            ],
        tones,
        ys,
        head:
          latest < 0 || coords.length === 0
            ? null
            : { x: coords[latest].x, y: ys[latest], tone: tones[latest] },
      }
    })
  })

  protected readonly yAxis = computed(() => {
    const scale = this.scale()
    return this.yTicks().map((t) => {
      const y = yOf(t.value, scale, HEIGHT)
      return { y, top: (y / HEIGHT) * 100, label: t.label }
    })
  })

  protected readonly at = computed(() => {
    const i = this.cursor()
    const n = this.lines()[0]?.values.length ?? 0
    if (i === null || i >= n || n < 2) return null
    return {
      x: (i / (n - 1)) * 100,
      marks: this.layers().flatMap((l) => {
        const y = l.ys[i]
        return y === null ? [] : [{ y, tone: l.tones[i] }]
      }),
    }
  })

  protected point(e: PointerEvent) {
    const n = this.lines()[0]?.values.length ?? 0
    const box = (e.currentTarget as HTMLElement).getBoundingClientRect()
    if (n < 2 || box.width === 0) return
    this.active.set(true)
    const share = Math.min(1, Math.max(0, (e.clientX - box.left) / box.width))
    this.scrub.emit(Math.round(share * (n - 1)))
  }

  protected leave(e: PointerEvent) {
    this.active.set(false)
    // Moving onto another trace sets the cursor there, so keep it rather than blink it out.
    const next = e.relatedTarget instanceof Element ? e.relatedTarget : null
    if (next?.closest('app-trace')) return
    this.scrub.emit(null)
  }
}
