import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  PLATFORM_ID,
  Injector,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core'
import { DecimalPipe, isPlatformBrowser } from '@angular/common'
import { PlatformStats, Stats } from '../stats'
import { scrollProgress } from '../charts'
import { Reveal } from '../../shared/reveal'
import { KindIcon } from '../kind-icon'
import { LiveSource } from '../live-source'
import { SandboxCta } from './sandbox-cta'
import { LaunchpadMark } from './launchpad-mark'

const PLATFORM_REPO = 'https://github.com/cujarrett/homelab/tree/main/platform/'

// dir: the kind's folder under platform/ in the homelab repo.
const TYPES: Record<string, { name: string; dir: string }> = {
  Api: { name: 'APIs', dir: 'api' },
  Spa: { name: 'Web apps', dir: 'spa' },
  GraphApi: { name: 'GraphQL services', dir: 'graph-api' },
  ManagedSecret: { name: 'Secrets', dir: 'managed-secret' },
  Wordpress: { name: 'WordPress sites', dir: 'wordpress' },
  FederatedGraph: { name: 'Federated graphs', dir: 'federated-graph' },
  Cache: { name: 'Caches', dir: 'cache' },
  NoSql: { name: 'NoSQL tables', dir: 'nosql' },
  Topic: { name: 'Event topics', dir: 'topic' },
  Subscription: { name: 'Subscriptions', dir: 'subscription' },
  Sql: { name: 'SQL databases', dir: 'sql' },
  ObjectStorage: { name: 'Storage buckets', dir: 'object-storage' },
}

// Both have an in-cluster variant and an AWS one, chosen by the developer.
const HAS_VARIANTS = new Set(['Cache', 'Sql'])

@Component({
  selector: 'app-platform',
  imports: [DecimalPipe, Reveal, KindIcon, LiveSource, SandboxCta, LaunchpadMark],
  templateUrl: './platform.html',
  styleUrl: './platform.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Platform {
  private readonly stats = inject(Stats)
  private readonly platformId = inject(PLATFORM_ID)
  private readonly host = inject(ElementRef<HTMLElement>)
  private readonly injector = inject(Injector)
  private readonly destroyRef = inject(DestroyRef)

  protected readonly data = signal<PlatformStats | null>(null)
  protected readonly failed = signal(false)
  protected readonly updatedAt = signal<number | null>(null)

  // How far the chart has scrolled up the screen, 0 to 1.
  // The bars grow with it, so scrolling back up empties them again.
  private readonly progress = signal(0)
  private still = false

  protected readonly types = computed(() => {
    const running = this.data()?.running.byType ?? []
    if (running.length === 0) return []
    // The API leaves out kinds with nothing running, so these two are added back at zero.
    // Both are offered in two places, and a missing row would hide that.
    const missing = [...HAS_VARIANTS]
      .filter((type) => !running.some((r) => r.type === type))
      .map((type) => ({ type, count: 0 }))
    return [...running, ...missing].map((r) => ({
      type: r.type,
      name: TYPES[r.type]?.name ?? r.type,
      // A kind missing from the list links to the platform folder itself.
      href: PLATFORM_REPO + (TYPES[r.type]?.dir ?? ''),
      count: r.count,
      variants: HAS_VARIANTS.has(r.type),
    }))
  })

  protected readonly build = computed(() => {
    const ws = this.data()?.workspaces
    if (!ws) return null
    const total = ws.build.totalSeconds
    // Scaled to the build itself, so the slowest step fills the row.
    const max = Math.max(4, Math.ceil(total / 4) * 4)
    const p = this.progress()
    const t = p * total
    return {
      max,
      ticks: [0, max / 4, max / 2, (3 * max) / 4, max],
      playing: p > 0 && p < 1,
      now: (t / max) * 100,
      steps: ws.build.steps.map((s) => ({
        ...s,
        label: s.seconds < 1 ? '<1 s' : `${Math.round(s.seconds)} s`,
        width: (Math.min(t, Math.max(s.seconds, 0.6)) / max) * 100,
        done: t >= s.seconds,
      })),
    }
  })

  constructor() {
    afterNextRender(async () => {
      if (!isPlatformBrowser(this.platformId)) return
      this.followScroll()
      await this.load()
      // Refreshes each minute while the tab is open, so the running count stays live.
      const doc = this.host.nativeElement.ownerDocument
      const ticker = setInterval(() => {
        if (doc.visibilityState === 'visible') this.load()
      }, 60_000)
      this.destroyRef.onDestroy(() => clearInterval(ticker))
    })
  }

  private async load() {
    try {
      const { data, at } = await this.stats.platform()
      this.data.set(data)
      this.updatedAt.set(at)
      this.failed.set(false)
      // The chart exists only once this render lands, so place its bars from where the page is.
      afterNextRender(() => this.measure(), { injector: this.injector })
    } catch {
      this.failed.set(true)
    }
  }

  // Slow scrolling is slow, fast is fast. With reduced motion the bars stay full.
  private followScroll() {
    const win = this.host.nativeElement.ownerDocument.defaultView
    if (!win) return
    if (win.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.still = true
      this.progress.set(1)
      return
    }
    let queued = 0
    const queue = () => {
      queued ||= win.requestAnimationFrame(() => {
        queued = 0
        this.measure()
      })
    }
    win.addEventListener('scroll', queue, { passive: true })
    win.addEventListener('resize', queue)
    this.destroyRef.onDestroy(() => {
      win.removeEventListener('scroll', queue)
      win.removeEventListener('resize', queue)
      win.cancelAnimationFrame(queued)
    })
  }

  private measure() {
    const chart = this.host.nativeElement.querySelector('.race')
    const win = chart?.ownerDocument.defaultView
    if (!chart || !win || this.still) return
    const box = chart.getBoundingClientRect()
    this.progress.set(scrollProgress(box.top, box.height, win.innerHeight))
  }
}
