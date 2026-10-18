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
import { DOCUMENT, isPlatformBrowser } from '@angular/common'
import { ClusterRange, ClusterStats, Stats } from '../stats'
import { LiveSource } from '../live-source'
import {
  areaPoints,
  bytesPerSecond,
  daysSince,
  gibibytes,
  health,
  last,
  spanOf,
  sparkPoints,
  thresholdStops,
} from '../charts'

// One node sparkline: the line coloured by the dashboard thresholds, and the area under it.
function chart(id: string, values: (number | null)[]) {
  const points = sparkPoints(values)
  const span = values.some((v) => v !== null) ? spanOf(values) : { lo: 0, hi: 0 }
  return { id: `hl-${id}`, points, area: areaPoints(points), stops: thresholdStops(span, 70, 85) }
}

@Component({
  selector: 'app-cluster',
  imports: [LiveSource],
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
      const cpu = last(n.cpu)
      const mem = last(n.memory)
      const role = n.role === 'control-plane' ? 'Control' : 'Worker'
      return {
        name: n.name,
        role: `${role}, ${gibibytes(n.memoryBytes)} GB`,
        cpu: Math.round(cpu),
        cpuHealth: health(cpu, 70, 85),
        cpuChart: chart(`cpu-${n.name}`, n.cpu),
        mem: Math.round(mem),
        memHealth: health(mem, 70, 85),
        memChart: chart(`mem-${n.name}`, n.memory),
        temp: n.temperatureC === null ? '–' : `${n.temperatureC.toFixed(1)}°C`,
        tempHealth: health(n.temperatureC ?? 0, 70, 80),
      }
    }),
  )

  protected readonly io = computed(() => {
    const d = this.data()
    if (!d) return null
    const pair = (a: (number | null)[], b: (number | null)[]) => {
      // Both lines on one scale, so in and out compare honestly.
      const span = spanOf(a, b)
      return {
        a: sparkPoints(a, 44, span),
        b: sparkPoints(b, 44, span),
        aArea: areaPoints(sparkPoints(a, 44, span), 44),
        bArea: areaPoints(sparkPoints(b, 44, span), 44),
        aNow: bytesPerSecond(last(a)),
        bNow: bytesPerSecond(last(b)),
      }
    }
    return { network: pair(d.network.in, d.network.out), disk: pair(d.disk.read, d.disk.write) }
  })

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
