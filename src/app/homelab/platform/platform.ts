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
import { DecimalPipe, isPlatformBrowser } from '@angular/common'
import { PlatformStats, Stats } from '../stats'
import { Reveal } from '../../shared/reveal'
import { KindIcon } from '../kind-icon'
import { LiveSource } from '../live-source'
import { SandboxCta } from './sandbox-cta'

const TYPE_NAMES: Record<string, string> = {
  Api: 'APIs',
  Spa: 'Web apps',
  GraphApi: 'GraphQL services',
  ManagedSecret: 'Secrets',
  Wordpress: 'WordPress sites',
  FederatedGraph: 'Federated graphs',
  Cache: 'Caches',
  NoSql: 'NoSQL tables',
  Topic: 'Event topics',
  Subscription: 'Subscriptions',
  Sql: 'SQL databases',
  ObjectStorage: 'Storage buckets',
}

@Component({
  selector: 'app-platform',
  imports: [DecimalPipe, Reveal, KindIcon, LiveSource, SandboxCta],
  templateUrl: './platform.html',
  styleUrl: './platform.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Platform {
  private readonly stats = inject(Stats)
  private readonly platformId = inject(PLATFORM_ID)
  private readonly host = inject(ElementRef<HTMLElement>)

  protected readonly data = signal<PlatformStats | null>(null)
  protected readonly failed = signal(false)
  protected readonly updatedAt = signal<number | null>(null)

  // Seconds into the replay. Null means at rest, which shows the finished build.
  private readonly t = signal<number | null>(null)

  protected readonly types = computed(() =>
    (this.data()?.running.byType ?? []).map((r) => ({
      type: r.type,
      name: TYPE_NAMES[r.type] ?? r.type,
      count: r.count,
    })),
  )

  protected readonly build = computed(() => {
    const ws = this.data()?.workspaces
    if (!ws) return null
    const total = ws.build.totalSeconds
    // Scaled to the build itself, so the slowest step fills the row.
    const max = Math.max(4, Math.ceil(total / 4) * 4)
    const t = this.t() ?? total
    return {
      clock: t.toFixed(1),
      max,
      ticks: [0, max / 4, max / 2, (3 * max) / 4, max],
      playing: this.t() !== null,
      now: (t / max) * 100,
      steps: ws.build.steps.map((s) => ({
        ...s,
        label: s.seconds < 1 ? '<1 s' : `${Math.round(s.seconds)} s`,
        width: (Math.min(t, Math.max(s.seconds, 0.6)) / max) * 100,
        done: t >= s.seconds,
      })),
    }
  })

  private frame = 0

  constructor() {
    const destroyRef = inject(DestroyRef)
    // A frame only exists in a browser. The server render has no cancelAnimationFrame.
    destroyRef.onDestroy(() => this.frame && cancelAnimationFrame(this.frame))

    afterNextRender(async () => {
      if (!isPlatformBrowser(this.platformId)) return
      await this.load()
      // Refreshes each minute while the tab is open, so the running count stays live.
      const doc = this.host.nativeElement.ownerDocument
      const ticker = setInterval(() => {
        if (doc.visibilityState === 'visible') this.load()
      }, 60_000)
      destroyRef.onDestroy(() => clearInterval(ticker))
      if (!this.data()) return
      // Replays once, the first time the build scrolls into view.
      const target = this.host.nativeElement.querySelector('.steps')
      if (!target || !('IntersectionObserver' in window)) return
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            observer.disconnect()
            this.play()
          }
        },
        { threshold: 0.6 },
      )
      observer.observe(target)
    })
  }

  private async load() {
    try {
      this.data.set(await this.stats.platform())
      this.updatedAt.set(Date.now())
      this.failed.set(false)
    } catch {
      this.failed.set(true)
    }
  }

  private play() {
    const ws = this.data()?.workspaces
    const win = this.host.nativeElement.ownerDocument.defaultView
    if (!ws || !win || win.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    cancelAnimationFrame(this.frame)
    const start = performance.now()
    const step = (now: number) => {
      const t = Math.min(ws.build.totalSeconds, (now - start) / 1000)
      this.t.set(t)
      if (t < ws.build.totalSeconds) this.frame = requestAnimationFrame(step)
      else this.t.set(null)
    }
    this.frame = requestAnimationFrame(step)
  }
}
