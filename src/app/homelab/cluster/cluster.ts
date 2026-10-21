import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  PLATFORM_ID,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core'
import { DOCUMENT, NgTemplateOutlet, isPlatformBrowser } from '@angular/common'
import { ClusterRange, ClusterStats, Stats } from '../stats'
import { LiveSource } from '../live-source'
import {
  bytesPerSecond,
  daysSince,
  gibibytes,
  health,
  interval,
  last,
  niceTicks,
  rateLabel,
  spanOf,
  stampOf,
  timeTicks,
} from '../charts'
import { Limits, Line, Trace } from './trace'

@Component({
  selector: 'app-cluster',
  imports: [LiveSource, NgTemplateOutlet, Trace],
  templateUrl: './cluster.html',
  styleUrl: './cluster.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Cluster {
  private readonly stats = inject(Stats)
  private readonly platformId = inject(PLATFORM_ID)
  private readonly document = inject(DOCUMENT)
  private readonly host = inject(ElementRef)

  protected readonly ranges: ClusterRange[] = ['1d', '7d', '30d']
  protected readonly range = signal<ClusterRange>('1d')
  protected readonly data = signal<ClusterStats | null>(null)
  protected readonly failed = signal(false)
  protected readonly updatedAt = signal<number | null>(null)
  private readonly now = signal(Date.now())
  // Sample index under the pointer, shared by every chart so they scrub together.
  protected readonly cursor = signal<number | null>(null)
  // Same thresholds as the homelab Grafana dashboards.
  protected readonly limits: Limits = { warn: 70, crit: 85 }

  protected readonly summary = computed(() => {
    const d = this.data()
    if (!d) return null
    const today = new Date(this.now())
    // The API reports outages to the day, so the streak counts whole days.
    const streak = (date: string | null) => {
      if (!date) return { value: '90+', unit: 'days' }
      const days = daysSince(date, today)
      return { value: `${days}`, unit: days === 1 ? 'day' : 'days' }
    }
    return {
      // Already truncated by the API, so a month never rounds up.
      availability: d.availability30d === null ? '–' : `${d.availability30d.toFixed(4)}%`,
      power: streak(d.lastPowerOutage),
      internet: streak(d.lastInternetOutage),
      nodes: d.nodes,
      pods: d.pods,
      apps: d.apps,
    }
  })

  protected readonly nodes = computed(() =>
    (this.data()?.perNode ?? []).map((n) => {
      const role = n.role === 'control-plane' ? 'Control' : 'Worker'
      return {
        name: n.name,
        role: `${role}, ${gibibytes(n.memoryBytes)} GB`,
        cpu: n.cpu,
        cpuLines: [{ values: n.cpu }] satisfies Line[],
        mem: n.memory,
        memLines: [{ values: n.memory }] satisfies Line[],
        temperatureC: n.temperatureC,
        temperature: n.temperature,
      }
    }),
  )

  protected readonly io = computed(() => {
    const d = this.data()
    if (!d) return null
    const pair = (a: (number | null)[], b: (number | null)[]) => {
      const lines: Line[] = [
        { values: a, tone: 's1' },
        { values: b, tone: 's2' },
      ]
      // Both lines share one scale that starts at zero, so in and out compare honestly.
      // The top sits above the busiest sample, which keeps its label clear of the line.
      const { span, ticks } = niceTicks(0, spanOf(a, b).hi * 1.15, 4)
      const yTicks = ticks.map((value) => ({
        value,
        label: value === span.hi ? rateLabel(value) : '',
      }))
      return { a, b, lines, span, yTicks }
    }
    return { network: pair(d.network.in, d.network.out), disk: pair(d.disk.read, d.disk.write) }
  })

  protected readonly ticks = computed(() => timeTicks(this.data()?.timestamps ?? []))

  protected readonly stamp = computed(() => {
    const times = this.data()?.timestamps
    const i = this.cursor()
    if (!times || i === null || times[i] === undefined) return ''
    return stampOf(times[i], times[1] - times[0])
  })

  protected readonly details = computed(() => {
    const times = this.data()?.timestamps ?? []
    const source = 'from Prometheus on the rack above'
    return [times.length < 2 ? source : `${source}, a point every ${interval(times[1] - times[0])}`]
  })

  // The number under the cursor, or the latest one when nothing is hovered.
  private at(values: (number | null)[]): number | null {
    const i = this.cursor()
    return i === null ? last(values) : (values[i] ?? null)
  }

  protected pct(values: (number | null)[]) {
    const v = this.at(values)
    if (v === null) return { text: '–', health: 'good' as const }
    return { text: `${Math.round(v)}%`, health: health(v, this.limits.warn, this.limits.crit) }
  }

  // The temperature under the cursor, or the current one when nothing is hovered.
  protected degrees(n: { temperatureC: number | null; temperature: (number | null)[] }) {
    const i = this.cursor()
    const v = i === null ? n.temperatureC : (n.temperature[i] ?? null)
    if (v === null) return { text: '–', health: 'good' as const }
    return { text: `${v.toFixed(1)}°C`, health: health(v, 70, 80) }
  }

  protected rate(values: (number | null)[]): string {
    const v = this.at(values)
    return v === null ? '–' : bytesPerSecond(v)
  }

  // Every range is kept once loaded, so switching shows numbers at once.
  // at: when the API read the numbers. fetched: when this page last asked.
  private readonly byRange = new Map<
    ClusterRange,
    { data: ClusterStats; at: number; fetched: number }
  >()
  private readonly loading = new Set<ClusterRange>()

  constructor() {
    const destroyRef = inject(DestroyRef)
    afterNextRender(async () => {
      if (!isPlatformBrowser(this.platformId)) return
      await this.load('1d')
      this.prefetchWhenSeen()
      const ticker = setInterval(() => {
        this.now.set(Date.now())
        const fetched = this.byRange.get(this.range())?.fetched ?? 0
        // Refresh once a minute, and only while someone can see the page.
        if (this.now() - fetched >= 60_000 && this.document.visibilityState === 'visible')
          this.load(this.range())
      }, 1000)
      destroyRef.onDestroy(() => clearInterval(ticker))
    })
  }

  // Fetched once the section is on screen, before anyone clicks.
  // Visitors who never scroll this far cost no extra Prometheus queries.
  private prefetchWhenSeen() {
    const host: HTMLElement = this.host.nativeElement
    const win = host.ownerDocument.defaultView
    if (!win || !('IntersectionObserver' in win)) return
    const observer = new IntersectionObserver(async (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return
      observer.disconnect()
      await this.load('7d')
      await this.load('30d')
    })
    observer.observe(host)
  }

  protected setRange(range: ClusterRange) {
    this.range.set(range)
    this.cursor.set(null)
    const kept = this.byRange.get(range)
    if (kept) {
      this.data.set(kept.data)
      this.updatedAt.set(kept.at)
    }
    if (!kept || Date.now() - kept.fetched >= 60_000) this.load(range)
  }

  private async load(range: ClusterRange) {
    if (this.loading.has(range)) return
    this.loading.add(range)
    try {
      const { data, at } = await this.stats.cluster(range)
      this.byRange.set(range, { data, at, fetched: Date.now() })
      if (range !== this.range()) return
      this.data.set(data)
      this.failed.set(false)
      this.updatedAt.set(at)
    } catch {
      if (range === this.range()) this.failed.set(true)
    } finally {
      this.loading.delete(range)
    }
  }
}
